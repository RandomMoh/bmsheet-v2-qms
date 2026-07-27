<?php
include 'webhook-config.php';

ignore_user_abort(true);
set_time_limit(30);

function debugLog($message) {
    $logFile = __DIR__ . '/debug_webhook.log';
    $time = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$time] $message\n", FILE_APPEND);
}

$statusFile = __DIR__ . '/webhook-status.json';
if (file_exists($statusFile)) {
    $statusData = json_decode(file_get_contents($statusFile), true);
    if (isset($statusData['paused']) && $statusData['paused'] === true) {
        debugLog("Webhook is PAUSED. Ignoring incoming payload.");
        http_response_code(200);
        echo json_encode(['status' => 'paused']);
        exit;
    }
}

function ackSlack() {
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok']);
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        if (ob_get_level()) ob_end_flush();
        flush();
    }
}

debugLog("Webhook triggered.");

if (isset($_SERVER['HTTP_X_SLACK_RETRY_NUM'])) {
    $retryNum = (int)$_SERVER['HTTP_X_SLACK_RETRY_NUM'];
    debugLog("Slack retry #$retryNum. Acknowledging without reprocessing.");
    http_response_code(200);
    echo 'ok';
    exit;
}

$raw = file_get_contents('php://input');

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

if (isset($payload['type']) && $payload['type'] === 'url_verification') {
    debugLog("URL verification challenge.");
    header('Content-Type: application/json');
    echo json_encode(['challenge' => $payload['challenge']]);
    exit;
}

$team_id = isset($payload['team_id']) ? $payload['team_id'] : '';
$workspace_id = null;
$bot_token = SLACK_BOT_TOKEN_FALLBACK;

if ($team_id) {
    $esc_team_id = mysqli_real_escape_string($conn, $team_id);
    $ws_res = mysqli_query($conn,
        "SELECT id, bot_token_shift1, bot_token_shift2, bot_token_shift3
         FROM slack_workspaces
         WHERE team_id='$esc_team_id'
         LIMIT 1"
    );
    if ($ws_res && $ws_row = mysqli_fetch_assoc($ws_res)) {
        $workspace_id = (int)$ws_row['id'];
        $bot_token = resolveShiftToken($ws_row);
        debugLog("Workspace #$workspace_id found. Shift token resolved.");
    } else {
        debugLog("WARNING: team_id '$team_id' not found in slack_workspaces. Using fallback token.");
    }
}

if (!isset($payload['event']['type']) || $payload['event']['type'] !== 'message') {
    debugLog("Not a message event. Ignoring.");
    http_response_code(200);
    exit;
}

$event       = $payload['event'];
$text        = isset($event['text'])      ? trim($event['text'])    : '';
$channel     = isset($event['channel'])   ? $event['channel']      : '';
$ts          = isset($event['ts'])        ? $event['ts']           : '';
$thread_ts   = isset($event['thread_ts']) ? $event['thread_ts']    : null;
$sender_user = isset($event['user'])      ? $event['user']         : '';
$sender_bot  = isset($event['bot_id'])    ? $event['bot_id']       : '';
$has_subtype = isset($event['subtype']);
$subtype     = $has_subtype ? $event['subtype'] : '';

$CSR_USER_IDS = [
    'U021771QZ9T', // Support Team
    'U09SF02BXJR', // Ahmed Hanif
    'U37QCSCEQ',   // orders@elementsproperty.co.uk
];

if ($thread_ts) {
    if ($sender_user && in_array($sender_user, $CSR_USER_IDS)) {
        $esc_thread_ts = mysqli_real_escape_string($conn, $thread_ts);
        $replyNow      = date('Y-m-d H:i:s');
        $esc_replyNow  = mysqli_real_escape_string($conn, $replyNow);

        $update_sql = "UPDATE `order`
            SET `query-first-reply_datetime` = '$esc_replyNow'
            WHERE (`slack_ts` = '$esc_thread_ts' OR `slack_ts` LIKE '{$esc_thread_ts}\\_%')
            AND `query-first-reply_datetime` IS NULL";

        $update_res = mysqli_query($conn, $update_sql);
        $affected   = mysqli_affected_rows($conn);

        if ($update_res && $affected > 0) {
            debugLog("✅ 1st reply stamped at $replyNow for thread $thread_ts — $affected order(s) updated (CSR: $sender_user).");
        } else {
            debugLog("Thread $thread_ts — no match or already has 1st reply (CSR: $sender_user).");
        }
    } else {
        debugLog("Thread reply from non-CSR ($sender_user). Ignored for 1st-reply stamping.");
    }

    ackSlack();
    exit;
}

if ($sender_user !== 'U37QCSCEQ') {
    if ($sender_bot || ($has_subtype && $subtype !== 'file_share')) {
        debugLog("Bot or non-file_share subtype ($subtype). Ignoring.");
        http_response_code(200);
        exit;
    }
}

$CSR_BLOCK_IDS = [
    'U09SF02BXJR', // Ahmed Hanif
];
if (in_array($sender_user, $CSR_BLOCK_IDS)) {
    debugLog("Message from blocked CSR $sender_user. Ignoring.");
    http_response_code(200);
    exit;
}

if ($text === '' && $subtype !== 'file_share') {
    debugLog("Empty text with no file. Ignoring.");
    http_response_code(200);
    exit;
}

$channelCtx   = null;
$esc_channel  = mysqli_real_escape_string($conn, $channel);
$ch_sql = "SELECT channel_name as name, default_department, default_project, hint
           FROM slack_channels
           WHERE channel_id='$esc_channel' AND is_active=1";
if ($workspace_id) {
    $ch_sql .= " AND workspace_id=$workspace_id";
}
$ch_res = mysqli_query($conn, $ch_sql);
if ($ch_res && $row = mysqli_fetch_assoc($ch_res)) {
    $channelCtx = $row;
}

if (!$channelCtx) {
    debugLog("BLOCKED: Channel $channel not registered or not active. Ignoring.");
    http_response_code(200);
    exit;
}

$channelName = $channelCtx['name'];
$channelHint = $channelCtx['hint'];
$defaultDept = $channelCtx['default_department'];
$defaultProj = $channelCtx['default_project'];

debugLog("Processing new top-level message from #$channelName | sender: $sender_user");

ackSlack();

function cleanSlackText($text) {
    $text = preg_replace('/<@[A-Z0-9]+>/i',                  '@user',  $text);
    $text = preg_replace('/<#[A-Z0-9]+\|([^>]+)>/i',         '#$1',    $text);
    $text = preg_replace('/<(https?:\/\/[^|>]+)\|([^>]+)>/i','$2',     $text);
    $text = preg_replace('/<(https?:\/\/[^>]+)>/i',          '$1',     $text);
    $text = preg_replace('/<[^>]+>/',                         '',       $text);
    $text = preg_replace('/\s+/',                             ' ',  trim($text));
    return $text;
}

$cleanText = cleanSlackText($text);

if (strlen($cleanText) < 3 && $subtype !== 'file_share') {
    debugLog("Message too short after cleanup: '$cleanText'. Ignoring.");
    exit;
}

if ($subtype === 'file_share' && strlen($cleanText) < 3) {
    $cleanText = '[File/image uploaded — no caption]';
}

function callGroq($prompt) {
    global $conn;
    $url  = 'https://api.groq.com/openai/v1/chat/completions';
    $body = json_encode([
        'model' => 'llama-3.1-8b-instant',
        'messages' => [
            ['role' => 'system', 'content' => 'You output strictly JSON format.'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'response_format' => ['type' => 'json_object'],
        'temperature' => 0.1,
    ]);

    $ch = curl_init($url);
    $headers = [];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . GROQ_API_KEY
        ],
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_HEADERFUNCTION => function($curl, $header) use (&$headers) {
            $len = strlen($header);
            $parts = explode(':', $header, 2);
            if (count($parts) == 2) {
                $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
            }
            return $len;
        }
    ]);
    $response = curl_exec($ch);
    $curlErr  = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (isset($headers['x-ratelimit-remaining-requests']) && isset($headers['x-ratelimit-remaining-tokens'])) {
        $req = (int)$headers['x-ratelimit-remaining-requests'];
        $tok = (int)$headers['x-ratelimit-remaining-tokens'];
        mysqli_query($conn, "UPDATE api_usage SET remaining_requests = $req, remaining_tokens = $tok WHERE id=1");
    }

    if ($curlErr || !$response) {
        debugLog("Groq cURL error: $curlErr");
        return null;
    }
    if ($httpCode !== 200) {
        debugLog("Groq HTTP $httpCode: " . substr($response, 0, 200));
        return null;
    }

    $result = json_decode($response, true);
    $aiText = $result['choices'][0]['message']['content'] ?? null;

    if (!$aiText) {
        debugLog("Groq returned no text. Response: " . substr($response, 0, 300));
        return null;
    }

    $aiText = preg_replace('/```(?:json)?\s*/i', '', $aiText);
    $aiText = trim($aiText);
    preg_match('/\{.*\}/s', $aiText, $matches);
    $cleanJson = $matches[0] ?? $aiText;
    $parsed    = json_decode($cleanJson, true);

    if (!is_array($parsed)) {
        debugLog("Groq JSON parse failed. Raw: " . substr($aiText, 0, 300));
        return null;
    }

    return array_change_key_case($parsed, CASE_LOWER);
}

function slackPost($url, $postPayload, $token) {
    $sh = curl_init($url);
    curl_setopt_array($sh, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS     => json_encode($postPayload),
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $res = curl_exec($sh);
    $err = curl_error($sh);
    curl_close($sh);
    if ($err) debugLog("Slack API error: $err");
    return $res;
}

$validProjectsList = ["3D","AH","AT","BB","Bierce","BR","Cubi","CB","CP 360 FP","CK","Capture","Code","Focal","Focal MP","Focal PB","Focal UI","Focal CAD","FNC","FS","GP","GF","HC","HSA","HM","HS","JH","JV","JL","MA","MD","ME","Metro","Mi","OH","Open House","PM","PRO","REM","Schematic","SA","Scan","Simple","Single","SKM","SM","TIFF","TQ","VG","WIN","Xactimate","ZFP","Roomio","Faro","FF","REFP"];
$validDeptsList    = ["Floor Plan","Photo Enhancement","3D Floor Plan","Video Editing","Virtual Staging"];
$validProjects     = implode(', ', $validProjectsList);
$validDepartments  = implode(', ', $validDeptsList);

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
- Messages that are just punctuation, emoji, or under 5 words with no address/order number
- Messages saying "Plan Done", "Uploaded on portal", "files have crashed" (STATUS UPDATES with no new order)
- File-only uploads with no caption (unless channel context implies all uploads are orders)

DEPARTMENT & PROJECT RULES:
- ONLY set department/project if the message EXPLICITLY mentions a specific one by name.
- If not mentioned, return "Unknown". Do NOT guess — the system will auto-assign from the channel.
- type: "Amend" if message mentions changes/amendments/redo/update, otherwise "New Order"
- order_id: prefer "#XXXXXX" order number if present, otherwise use the property address

Return ONLY the JSON object. No explanation.';

$parsed = callGroq($prompt);

if ($parsed === null) {
    debugLog("SKIPPED: Groq failed for message from #$channelName. Text: " . substr($cleanText, 0, 100));
    exit;
}

$isOrder = isset($parsed['is_order']) && ($parsed['is_order'] === true || $parsed['is_order'] === 'true' || $parsed['is_order'] === 1);

if (!$isOrder) {
    debugLog("Not an order (AI verdict). Text: " . substr($cleanText, 0, 80));
    exit;
}

$department = isset($parsed['department']) ? trim($parsed['department']) : '';
if (!in_array($department, $validDeptsList)) {
    debugLog("AI returned invalid department '$department'. Using channel default.");
    $department = ($defaultDept !== '') ? $defaultDept : 'Unassigned';
}

$projectName = isset($parsed['project_name']) ? trim($parsed['project_name']) : '';
if (!in_array($projectName, $validProjectsList)) {
    debugLog("AI returned invalid project '$projectName'. Using channel default.");
    $projectName = ($defaultProj !== '') ? $defaultProj : 'Unassigned';
}

if (strpos($cleanText, 'IE') !== false) {
    $department  = 'Photo Enhancement';
    $projectName = 'Single';
    debugLog("Bulletproof rule applied: 'IE' found -> Photo Enhancement / Single");
} elseif (strpos($cleanText, 'FC') !== false) {
    $department  = 'Floor Plan';
    $projectName = 'Single';
    debugLog("Bulletproof rule applied: 'FC' found -> Floor Plan / Single");
}

$type = isset($parsed['type']) ? trim($parsed['type']) : '';
if ($type !== 'New Order' && $type !== 'Amend') {
    $type = 'New Order';
}

preg_match_all('/#(\d{4,7})/', $cleanText, $orderMatches);
$extractedOrders = array_unique($orderMatches[1]);

if (empty($extractedOrders)) {
    $aiOrderId       = trim($parsed['order_id'] ?? '');
    $extractedOrders = [($aiOrderId !== '') ? $aiOrderId : substr($cleanText, 0, 200)];
}

debugLog("Found " . count($extractedOrders) . " order(s): " . implode(', #', $extractedOrders));

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

$loggedOrders  = [];
$skippedOrders = [];

foreach ($extractedOrders as $singleOrder) {
    $singleOrder = trim($singleOrder);
    if ($singleOrder === '') continue;

    $esc_orderId = mysqli_real_escape_string($conn, $singleOrder);

    $dup_res = mysqli_query($conn,
        "SELECT id FROM `order`
         WHERE `propery-order` = '$esc_orderId'
         AND `date` = '$esc_date'
         LIMIT 1"
    );
    if ($dup_res && mysqli_num_rows($dup_res) > 0) {
        debugLog("Duplicate skipped: #$singleOrder (already logged today).");
        $skippedOrders[] = $singleOrder;
        continue;
    }

    $orderTs     = (count($extractedOrders) > 1) ? $ts . '_' . $singleOrder : $ts;
    $esc_orderTs = mysqli_real_escape_string($conn, $orderTs);

    $insert_sql = "INSERT INTO `order`
        (`year`, `month`, `date`, `communication_medium`, `project_name`, `department`,
         `type`, `propery-order`, `query-received_datetime`, `inserted_datetime`,
         `qname`, `status`, `reminder_hours`, `instruction`, `slack_ts`)
        VALUES
        ('$esc_year', '$esc_month', '$esc_date', 'Slack', '$esc_projectName', '$esc_dept',
         '$esc_type', '$esc_orderId', '$esc_now', '$esc_now',
         'Slack Bot', 'pending', 4, '', '$esc_orderTs')";

    $insert_res = mysqli_query($conn, $insert_sql);

    if ($insert_res) {
        $loggedOrders[] = $singleOrder;
        debugLog("✅ ORDER LOGGED from #$channelName: #$singleOrder | Dept: $department | Proj: $projectName | Type: $type");
    } else {
        debugLog("❌ DB INSERT FAILED for #$singleOrder: " . mysqli_error($conn));
    }
}

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


    slackPost('https://slack.com/api/reactions.add', [
        'channel'   => $channel,
        'name'      => 'white_check_mark',
        'timestamp' => $ts,
    ], $bot_token);

} elseif (!empty($skippedOrders)) {
    debugLog("All orders in this message were already logged today. No new entries.");
}

exit;