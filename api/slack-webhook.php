<?php
include 'config.php';
date_default_timezone_set('Asia/Karachi');

// ═══════════════════════════════════════════════════════════════
// RESPONSE FAST — Slack expects 200 within 3 seconds.
// We respond immediately, then continue processing.
// ═══════════════════════════════════════════════════════════════
ignore_user_abort(true);
set_time_limit(30);

function debugLog($message) {
    $logFile = __DIR__ . '/debug_webhook.log';
    $time = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$time] $message\n", FILE_APPEND);
}

// Send 200 OK to Slack immediately to prevent retries
function ackSlack() {
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok']);

    // Flush output to Slack so it stops waiting
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        ob_end_flush();
        flush();
    }
}

debugLog("Webhook triggered.");

// ─── Slack retries: reject immediately ───
if (isset($_SERVER['HTTP_X_SLACK_RETRY_NUM'])) {
    debugLog("Slack retry #" . $_SERVER['HTTP_X_SLACK_RETRY_NUM'] . ". Rejecting.");
    http_response_code(200);
    echo 'ok';
    exit;
}

$raw = file_get_contents('php://input');

// Rotate log: only keep last 500KB to prevent unbounded growth
$logPath = __DIR__ . '/webhook_log.txt';
if (file_exists($logPath) && filesize($logPath) > 512000) {
    $lines = file($logPath);
    file_put_contents($logPath, implode('', array_slice($lines, -200)));
}
file_put_contents($logPath, '[' . date('Y-m-d H:i:s') . '] ' . $raw . "\n", FILE_APPEND);

$payload = json_decode($raw, true);

if (!$payload || !is_array($payload)) {
    debugLog("Invalid JSON payload. Exiting.");
    http_response_code(400);
    exit;
}

// ─── URL verification (Slack app setup) ───
if (isset($payload['type']) && $payload['type'] === 'url_verification') {
    debugLog("URL verification challenge.");
    header('Content-Type: application/json');
    echo json_encode(['challenge' => $payload['challenge']]);
    exit;
}

// ─── Only process message events ───
if (
    !isset($payload['event']['type']) ||
    $payload['event']['type'] !== 'message'
) {
    debugLog("Not a message event. Ignoring.");
    http_response_code(200);
    exit;
}

$event = $payload['event'];
$text        = isset($event['text']) ? trim($event['text']) : '';
$channel     = isset($event['channel']) ? $event['channel'] : '';
$ts          = isset($event['ts']) ? $event['ts'] : '';
$thread_ts   = isset($event['thread_ts']) ? $event['thread_ts'] : null;
$sender_user = isset($event['user']) ? $event['user'] : '';
$sender_bot  = isset($event['bot_id']) ? $event['bot_id'] : '';
$has_subtype = isset($event['subtype']);

// ═══════════════════════════════════════════════════════════════
// CSR TEAM REGISTRY — Only these users' thread replies count
// as "1st reply" in QMS. Client replies are ignored.
//
// To get a Slack user ID:
//   Click profile → "⋮" → "Copy member ID"
// ═══════════════════════════════════════════════════════════════
$CSR_USER_IDS = [
    'U021771QZ9T', // Support Team
    'U09SF02BXJR', // Ahmed Hanif
];

// ═══════════════════════════════════════════════════════════════
// CHANNEL REGISTRY — Maps channel IDs to default dept/project.
// Only channels listed here will be processed for new orders.
// Messages from unlisted channels are IGNORED (safety guard).
// ═══════════════════════════════════════════════════════════════
$CHANNEL_MAP = [
    'C02203MEEBS' => [
        'name'              => 'bm-xactimate-trueplan-operations',
        'default_department' => 'Floor Plan',
        'default_project'    => 'Xactimate',
        'hint'              => 'This channel is for Xactimate/TruePlan floor plan orders. Default project is Xactimate.',
    ],
    'C0ALZCHAE1G' => [
        'name'              => 'bm-internal-dev-testing',
        'default_department' => '',
        'default_project'    => '',
        'hint'              => '',
    ],
];

// ─────────────────────────────────────────────────────────────
// THREAD REPLY HANDLING — process BEFORE filtering out bots
// because Support Team may reply via bot-like integrations.
// ─────────────────────────────────────────────────────────────
if ($thread_ts) {
    if ($sender_user && in_array($sender_user, $CSR_USER_IDS)) {
        $esc_thread_ts = mysqli_real_escape_string($conn, $thread_ts);
        $replyNow = date('Y-m-d H:i:s');
        $esc_replyNow = mysqli_real_escape_string($conn, $replyNow);

        // Use LIKE to match both single-order (exact ts) and multi-order (ts_ordernum) entries
        $update_sql = "UPDATE `order`
            SET `query-first-reply_datetime` = '$esc_replyNow'
            WHERE (`slack_ts` = '$esc_thread_ts' OR `slack_ts` LIKE '{$esc_thread_ts}\\_%')
            AND `query-first-reply_datetime` IS NULL";
        $update_res = mysqli_query($conn, $update_sql);
        $affected = mysqli_affected_rows($conn);

        if ($update_res && $affected > 0) {
            debugLog("1st reply recorded at $replyNow for thread $thread_ts — $affected order(s) updated (user: $sender_user).");
        } else {
            debugLog("Thread $thread_ts — no match or already has 1st reply.");
        }
    } else {
        debugLog("Thread reply from non-CSR ($sender_user). Ignored.");
    }

    ackSlack();
    exit;
}

// ─── Filter: only human, top-level messages from registered channels ───
if ($sender_bot || $has_subtype) {
    debugLog("Bot/subtype message. Ignoring.");
    http_response_code(200);
    exit;
}

// Safety: ignore messages from CSR accounts (they post status updates, not orders)
// NOTE: U021771QZ9T (Support Team) temporarily UNBLOCKED for testing.
// Re-enable after deploying to public channel.
$CSR_BLOCK_IDS = [
    // 'U021771QZ9T', // Support Team — UNBLOCKED FOR TESTING
    'U09SF02BXJR', // Ahmed Hanif
];
if (in_array($sender_user, $CSR_BLOCK_IDS)) {
    debugLog("Message from CSR user $sender_user. Not an order. Ignoring.");
    http_response_code(200);
    exit;
}

if ($text === '') {
    debugLog("Empty text. Ignoring.");
    http_response_code(200);
    exit;
}

// ─── Channel validation ───
$channelCtx = isset($CHANNEL_MAP[$channel]) ? $CHANNEL_MAP[$channel] : null;

if (!$channelCtx) {
    debugLog("BLOCKED: Message from unregistered channel $channel. Ignoring for safety.");
    http_response_code(200);
    exit;
}

$channelName = $channelCtx['name'];
$channelHint = $channelCtx['hint'];
$defaultDept = $channelCtx['default_department'];
$defaultProj = $channelCtx['default_project'];

debugLog("Processing from #$channelName | sender: $sender_user");

// ─── Acknowledge Slack NOW, then continue heavy processing ───
ackSlack();

// ═══════════════════════════════════════════════════════════════
// TEXT CLEANUP — strip Slack formatting before sending to AI
// ═══════════════════════════════════════════════════════════════
function cleanSlackText($text) {
    // Replace user mentions <@U1234ABC> with @user
    $text = preg_replace('/<@[A-Z0-9]+>/i', '@user', $text);
    // Replace channel links <#C1234|channel-name> with #channel-name
    $text = preg_replace('/<#[A-Z0-9]+\|([^>]+)>/i', '#$1', $text);
    // Replace URLs <http://...|label> with label, or just the URL
    $text = preg_replace('/<(https?:\/\/[^|>]+)\|([^>]+)>/i', '$2', $text);
    $text = preg_replace('/<(https?:\/\/[^>]+)>/i', '$1', $text);
    // Strip remaining angle-bracket markup
    $text = preg_replace('/<[^>]+>/', '', $text);
    // Collapse whitespace
    $text = preg_replace('/\s+/', ' ', trim($text));
    return $text;
}

$cleanText = cleanSlackText($text);

if (strlen($cleanText) < 3) {
    debugLog("Message too short after cleanup: '$cleanText'. Ignoring.");
    exit;
}

// ═══════════════════════════════════════════════════════════════
// GEMINI AI — Order parsing
// ═══════════════════════════════════════════════════════════════
function callGemini($prompt) {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . GEMINI_API_KEY;
    $body = json_encode([
        'contents' => [['parts' => [['text' => $prompt]]]],
        'generationConfig' => [
            'response_mime_type' => 'application/json',
            'temperature' => 0.1  // Low temperature = less hallucination
        ]
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0
    ]);
    $response = curl_exec($ch);
    $curlErr = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlErr || !$response) {
        debugLog("Gemini cURL error: $curlErr");
        return null;
    }

    if ($httpCode !== 200) {
        debugLog("Gemini HTTP $httpCode: " . substr($response, 0, 200));
        return null;
    }

    $result = json_decode($response, true);
    $aiText = isset($result['candidates'][0]['content']['parts'][0]['text'])
        ? $result['candidates'][0]['content']['parts'][0]['text']
        : null;

    if (!$aiText) {
        debugLog("Gemini returned no text. Response: " . substr($response, 0, 300));
        return null;
    }

    $aiText = preg_replace('/```(?:json)?\s*/i', '', $aiText);
    $aiText = trim($aiText);
    preg_match('/\{.*\}/s', $aiText, $matches);
    $cleanJson = isset($matches[0]) ? $matches[0] : $aiText;
    $parsed = json_decode($cleanJson, true);

    if (!is_array($parsed)) {
        debugLog("Gemini JSON parse failed. Raw: " . substr($aiText, 0, 300));
        return null;
    }

    return array_change_key_case($parsed, CASE_LOWER);
}

function slackPost($url, $payload) {
    $sh = curl_init($url);
    curl_setopt_array($sh, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . SLACK_BOT_TOKEN
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    $res = curl_exec($sh);
    $err = curl_error($sh);
    curl_close($sh);
    if ($err) debugLog("Slack API error: $err");
    return $res;
}

// Valid values for strict validation
$validProjectsList = ["3D","AH","AT","BB","Bierce","BR","Cubi","CB","CP 360 FP","CK","Capture","Code","Focal","Focal MP","Focal PB","Focal UI","Focal CAD","FNC","FS","GP","GF","HC","HSA","HM","HS","JH","JV","JL","MA","MD","ME","Metro","Mi","OH","Open House","PM","PRO","REM","Schematic","SA","Scan","Simple","Single","SKM","SM","TIFF","TQ","VG","WIN","Xactimate","ZFP","Roomio","Faro","FF","REFP"];
$validDeptsList = ["Floor Plan","Photo Enhancement","3D Floor Plan","Video Editing","Virtual Staging"];
$validProjects = implode(', ', $validProjectsList);
$validDepartments = implode(', ', $validDeptsList);

// ─── Build prompt with channel context ───
$escapedText = str_replace(['"', '\\', "\n", "\r"], ['\\"', '\\\\', ' ', ''], $cleanText);

$prompt = 'You are a strict order-detection bot for Benchmark Studio (a property floor plan company). Analyze this Slack message from the channel "#' . $channelName . '":

"' . $escapedText . '"

CHANNEL CONTEXT: ' . $channelHint . '

Return a single JSON object:
{
  "is_order": boolean,
  "department": "one of: ' . $validDepartments . '",
  "project_name": "one of: ' . $validProjects . '",
  "type": "New Order or Amend",
  "order_id": "extracted order number or property address"
}

STRICT RULES — follow exactly:

WHAT IS AN ORDER (is_order: true):
- A message containing a PROPERTY ADDRESS (street, city, state/postcode)
- A message containing an ORDER NUMBER like #314924, #313583, Order #314888, Portal Order #315052
- A message about creating, amending, or redoing a floor plan, 3D render, photo edit, etc.
- A message asking to "monitor" or "complete" specific order numbers — these ARE orders to track
- IMPORTANT: If the message contains ANY order number (#XXXXXX format), it IS an order regardless of surrounding text

WHAT IS NOT AN ORDER (is_order: false):
- Greetings, thank yous, good morning messages with NO order numbers
- General questions with no order numbers like "are these done?", "how is everyone?"
- Internal coordination with NO specific order numbers like "they are due in 2 hours"
- File-only messages with no work context
- Messages that are just punctuation, emoji, or under 5 words with no address/order number
- Messages saying "Plan Done", "Uploaded on portal", "files have crashed" (STATUS UPDATES with no new order)

DEPARTMENT & PROJECT RULES:
- ONLY set department/project if the message EXPLICITLY mentions a specific one by name (e.g. "Focal", "Capture", "3D", "Photo Enhancement").
- If the message does NOT mention any specific project or department name, return "Unknown" for that field. Do NOT guess or infer from context — the system will auto-assign based on the channel.
- For type: "Amend" if message mentions changes/amendments/redo/update, otherwise "New Order"
- For order_id: prefer "#XXXXXX" order number format if present, otherwise use the property address

Return ONLY the JSON object. No explanation.';

$parsed = callGemini($prompt);

// ─── CRITICAL: If AI fails, do NOT blindly insert. Skip and log. ───
if ($parsed === null) {
    debugLog("SKIPPED: Gemini failed for message from #$channelName. Text: " . substr($cleanText, 0, 100));
    // No Slack reply — silently fail. The CSR can manually add it via QMS portal.
    exit;
}

// ─── Validate is_order ───
$isOrder = isset($parsed['is_order']) && ($parsed['is_order'] === true || $parsed['is_order'] === 'true' || $parsed['is_order'] === 1);

if (!$isOrder) {
    debugLog("Not an order (AI verdict). Text: " . substr($cleanText, 0, 80));
    exit;
}

// ─── Validate & sanitize AI output ───
$department = isset($parsed['department']) ? trim($parsed['department']) : '';
if (!in_array($department, $validDeptsList)) {
    debugLog("AI returned invalid department '$department'. Using channel default.");
    $department = $defaultDept !== '' ? $defaultDept : 'Unassigned';
}

$projectName = isset($parsed['project_name']) ? trim($parsed['project_name']) : '';
if (!in_array($projectName, $validProjectsList)) {
    debugLog("AI returned invalid project '$projectName'. Using channel default.");
    $projectName = $defaultProj !== '' ? $defaultProj : 'Unassigned';
}

$type = isset($parsed['type']) ? trim($parsed['type']) : '';
if ($type !== 'New Order' && $type !== 'Amend') {
    $type = 'New Order';
}

// ═══════════════════════════════════════════════════════════════
// EXTRACT ALL ORDER IDs — handle multi-order messages
// ═══════════════════════════════════════════════════════════════
// First: extract all #XXXXXX order numbers from the raw text
preg_match_all('/#(\d{4,7})/', $cleanText, $orderMatches);
$extractedOrders = array_unique($orderMatches[1]);

// If AI returned a single order_id and we found none in regex, use AI's
if (empty($extractedOrders)) {
    $aiOrderId = isset($parsed['order_id']) && trim($parsed['order_id']) !== ''
        ? trim($parsed['order_id'])
        : substr($cleanText, 0, 200);
    $extractedOrders = [$aiOrderId];
}

debugLog("Found " . count($extractedOrders) . " order(s) in message: " . implode(', #', $extractedOrders));

// ═══════════════════════════════════════════════════════════════
// DATABASE INSERT — one row per order
// ═══════════════════════════════════════════════════════════════
$now   = date('Y-m-d H:i:s');
$date  = date('Y-m-d');
$year  = (int)date('Y');
$month = date('m');

$esc_year        = mysqli_real_escape_string($conn, $year);
$esc_month       = mysqli_real_escape_string($conn, $month);
$esc_date        = mysqli_real_escape_string($conn, $date);
$esc_projectName = mysqli_real_escape_string($conn, $projectName);
$esc_dept        = mysqli_real_escape_string($conn, $department);
$esc_type        = mysqli_real_escape_string($conn, $type);
$esc_now         = mysqli_real_escape_string($conn, $now);
$esc_ts          = mysqli_real_escape_string($conn, $ts);

$loggedOrders = [];
$skippedOrders = [];

foreach ($extractedOrders as $singleOrder) {
    $singleOrder = trim($singleOrder);
    if ($singleOrder === '') continue;

    $esc_orderId = mysqli_real_escape_string($conn, $singleOrder);

    // Duplicate check (same order on same day)
    $dup_sql = "SELECT id FROM `order` WHERE `propery-order` = '$esc_orderId' AND `date` = '$esc_date' LIMIT 1";
    $dup_res = mysqli_query($conn, $dup_sql);
    if ($dup_res && mysqli_num_rows($dup_res) > 0) {
        debugLog("Duplicate skipped: #$singleOrder (already logged today).");
        $skippedOrders[] = $singleOrder;
        continue;
    }

    // Use slack_ts + order suffix for multi-order uniqueness
    $orderTs = (count($extractedOrders) > 1) ? $ts . '_' . $singleOrder : $ts;
    $esc_orderTs = mysqli_real_escape_string($conn, $orderTs);

    $insert_sql = "INSERT INTO `order`
        (`year`, `month`, `date`, `communication_medium`, `project_name`, `department`, `type`, `propery-order`, `query-received_datetime`, `inserted_datetime`, `qname`, `status`, `reminder_hours`, `instruction`, `slack_ts`)
        VALUES
        ('$esc_year', '$esc_month', '$esc_date', 'Slack', '$esc_projectName', '$esc_dept', '$esc_type', '$esc_orderId', '$esc_now', '$esc_now', 'Slack Bot', 'pending', 4, '', '$esc_orderTs')";

    $insert_res = mysqli_query($conn, $insert_sql);

    if ($insert_res) {
        $loggedOrders[] = $singleOrder;
        debugLog("✅ ORDER LOGGED from #$channelName: #$singleOrder | Dept: $department | Proj: $projectName | Type: $type");
    } else {
        debugLog("DB INSERT FAILED for #$singleOrder: " . mysqli_error($conn));
    }
}

// ─── Slack confirmation (in thread) ───
if (!empty($loggedOrders)) {
    if (count($loggedOrders) === 1) {
        $replyText = "✅ *Order Logged*\n"
            . "• *Order:* #" . $loggedOrders[0] . "\n"
            . "• *Project:* " . $projectName . "\n"
            . "• *Dept:* " . $department . "\n"
            . "• *Type:* " . $type;
    } else {
        $orderList = implode(', #', $loggedOrders);
        $replyText = "✅ *" . count($loggedOrders) . " Orders Logged*\n"
            . "• *Orders:* #" . $orderList . "\n"
            . "• *Project:* " . $projectName . "\n"
            . "• *Dept:* " . $department . "\n"
            . "• *Type:* " . $type;
    }

    if (!empty($skippedOrders)) {
        $replyText .= "\n⚠️ _Skipped (already logged today):_ #" . implode(', #', $skippedOrders);
    }

    slackPost('https://slack.com/api/chat.postMessage', [
        'channel' => $channel,
        'text' => $replyText,
        'thread_ts' => $ts
    ]);

    slackPost('https://slack.com/api/reactions.add', [
        'channel' => $channel,
        'name' => 'white_check_mark',
        'timestamp' => $ts
    ]);
} elseif (!empty($skippedOrders)) {
    debugLog("All orders were duplicates. No new entries.");
}

exit;