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

// Send instant HTTP 200 OK response to Slack before any DB or AI processing
ackSlack();

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

function getSlackUserName($userId, $token) {
    if (!$userId) return 'Slack User';
    static $userCache = [];
    if (isset($userCache[$userId])) return $userCache[$userId];
    
    $url = "https://slack.com/api/users.info?user=" . urlencode($userId);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    if ($res) {
        $json = json_decode($res, true);
        if (isset($json['ok']) && $json['ok'] && isset($json['user'])) {
            $u = $json['user'];
            $name = $u['profile']['real_name'] ?? $u['profile']['display_name'] ?? $u['name'] ?? $userId;
            $userCache[$userId] = $name;
            return $name;
        }
    }
    $userCache[$userId] = $userId;
    return $userId;
}

if ($thread_ts) {
    $cleanReplyText = cleanSlackText($text);
    $replyNow       = $ts ? date('Y-m-d H:i:s', intval($ts)) : date('Y-m-d H:i:s');
    $esc_thread_ts  = mysqli_real_escape_string($conn, $thread_ts);
    $esc_replyNow   = mysqli_real_escape_string($conn, $replyNow);

    // 1. Stamp 1st reply datetime if this is a CSR reply
    if ($sender_user && in_array($sender_user, $CSR_USER_IDS)) {
        $update_first = "UPDATE `order`
            SET `query-first-reply_datetime` = '$esc_replyNow'
            WHERE (`slack_ts` = '$esc_thread_ts' OR `slack_ts` LIKE '{$esc_thread_ts}\\_%')
            AND `query-first-reply_datetime` IS NULL";
        mysqli_query($conn, $update_first);
    }

    // 2. Check if the thread reply indicates COMPLETION or ISSUE
    $isCompletionReply = preg_match('/\b(uploaded|done|completed|ready|cleared|sent|delivered|portal)\b/i', $cleanReplyText);
    $isIssueReply      = preg_match('/\b(issue|missing|error|redo|revision|amend|changes|ask customer|email customer|provide template)\b/i', $cleanReplyText);

    if ($isCompletionReply || $isIssueReply) {
        $csrName     = getSlackUserName($sender_user, $bot_token);
        $esc_csrName = mysqli_real_escape_string($conn, $csrName);

        // A. Look for order number in reply text (#XXXXXX format)
        preg_match_all('/#(\d{4,7})/', $cleanReplyText, $replyMatches);
        $foundOrders = array_unique($replyMatches[1] ?? []);

        // B. If no order number in reply, check DB for orders with this thread_ts
        if (empty($foundOrders)) {
            $db_res = mysqli_query($conn, "SELECT DISTINCT `propery-order` FROM `order` WHERE `slack_ts` = '$esc_thread_ts' OR `slack_ts` LIKE '{$esc_thread_ts}\\_%'");
            if ($db_res) {
                while ($r = mysqli_fetch_assoc($db_res)) {
                    if (!empty($r['propery-order'])) $foundOrders[] = $r['propery-order'];
                }
            }
        }

        // C. If still no order number, fetch parent thread message from Slack API
        if (empty($foundOrders)) {
            $parentUrl = "https://slack.com/api/conversations.replies?channel=" . urlencode($channel) . "&ts=" . urlencode($thread_ts) . "&limit=1";
            $pch = curl_init($parentUrl);
            curl_setopt_array($pch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $bot_token],
                CURLOPT_TIMEOUT        => 5,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            $pres = curl_exec($pch);
            curl_close($pch);
            if ($pres) {
                $pjson = json_decode($pres, true);
                if (isset($pjson['messages'][0]['text'])) {
                    $parentText = cleanSlackText($pjson['messages'][0]['text']);
                    preg_match_all('/#(\d{4,7})/', $parentText, $parentMatches);
                    $foundOrders = array_unique($parentMatches[1] ?? []);
                    if (empty($foundOrders)) {
                        $foundOrders = [substr($parentText, 0, 80)];
                    }
                }
            }
        }

        // Process found orders
        foreach ($foundOrders as $targetOrder) {
            $targetOrder = trim($targetOrder);
            if (!$targetOrder) continue;
            $esc_targetOrder = mysqli_real_escape_string($conn, $targetOrder);
            $esc_cleanText   = mysqli_real_escape_string($conn, $cleanReplyText);

            $chk_res = mysqli_query($conn, "SELECT id, status FROM `order` WHERE `propery-order` = '$esc_targetOrder' ORDER BY id DESC LIMIT 1");
            
            if ($isCompletionReply) {
                $esc_botName = mysqli_real_escape_string($conn, 'Slack Bot');
                if ($chk_res && $chk_row = mysqli_fetch_assoc($chk_res)) {
                    $oid = $chk_row['id'];
                    mysqli_query($conn, "UPDATE `order` SET `status` = 'completed', `type` = 'Completion', `query_done` = '$esc_replyNow', `completed_by` = '$esc_botName', `query-first-reply_datetime` = COALESCE(`query-first-reply_datetime`, '$esc_replyNow') WHERE id = $oid");
                    debugLog("Thread Completion: Updated existing order #$targetOrder to completed (by Slack Bot).");
                } else {
                    $date  = $ts ? date('Y-m-d', intval($ts)) : date('Y-m-d');
                    $year  = date('Y');
                    $month = date('m');
                    $esc_dept = mysqli_real_escape_string($conn, ($channelCtx && $channelCtx['default_department']) ? $channelCtx['default_department'] : 'Floor Plan');
                    $esc_proj = mysqli_real_escape_string($conn, ($channelCtx && $channelCtx['default_project']) ? $channelCtx['default_project'] : 'Single');
                    
                    $ins_sql = "INSERT INTO `order`
                        (`year`, `month`, `date`, `communication_medium`, `project_name`, `department`,
                         `type`, `propery-order`, `query-received_datetime`, `query-first-reply_datetime`, `inserted_datetime`,
                         `qname`, `status`, `query_done`, `completed_by`, `reminder_hours`, `instruction`, `slack_ts`)
                        VALUES
                        ('$year', '$month', '$date', 'Slack', '$esc_proj', '$esc_dept',
                         'Completion', '$esc_targetOrder', '$esc_replyNow', '$esc_replyNow', '$esc_replyNow',
                         'Slack Bot', 'completed', '$esc_replyNow', '$esc_botName', 4, '$esc_cleanText', '$esc_thread_ts')";
                    mysqli_query($conn, $ins_sql);
                    debugLog("Thread Completion: Created NEW completed order #$targetOrder (by Slack Bot).");
                }

                // Add checkmark reaction to thread reply in Slack
                slackPost('https://slack.com/api/reactions.add', [
                    'channel'   => $channel,
                    'name'      => 'white_check_mark',
                    'timestamp' => $ts,
                ], $bot_token);
            } elseif ($isIssueReply && !$isCompletionReply) {
                if ($chk_res && $chk_row = mysqli_fetch_assoc($chk_res)) {
                    $oid = $chk_row['id'];
                    mysqli_query($conn, "UPDATE `order` SET `status` = 'issue', `type` = 'Issue', `instruction` = '$esc_cleanText' WHERE id = $oid");
                    debugLog("Thread Issue: Updated order #$targetOrder to issue.");
                }
            }
        }
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

// Pre-filter: Check if the message is asking for ETA / Status update
if (preg_match('/\b(eta|status|update|when will|any news|turnaround|how long|progress)\b/i', $cleanText) &&
    !preg_match('/\b(uploaded|done|completed|ready|issue|missing|error|redo|revision|amend|changes|attached)\b/i', $cleanText)) {
    debugLog("SKIPPED: Message is an ETA/Status inquiry: '$cleanText'");
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
    if ($err) {
        debugLog("Slack API cURL error ($url): $err");
    } else if ($res) {
        $json = json_decode($res, true);
        if (isset($json['ok']) && $json['ok'] === false) {
            debugLog("Slack API error ($url): " . ($json['error'] ?? 'unknown') . " | payload: " . json_encode($postPayload));
        }
    }
    return $res;
}

$validProjectsList = ["3D","AH","AT","BB","Bierce","BR","Cubi","CB","CP 360 FP","CK","Capture","Code","Focal","Focal MP","Focal PB","Focal UI","Focal CAD","Focal CRM","Focal Video","FNC","FS","GP","GF","HC","HSA","HM","HS","JH","JV","JL","MA","MD","ME","Metro","Mi","OH","Open House","PM","PRO","REM","Schematic","SA","Scan","Simple","Single","SKM","SM","TIFF","TQ","VG","WIN","Xactimate","ZFP","Roomio","Faro","FF","REFP","SB","CT","Creative","Now","Prestige","HDR","Esoft","Nat3D","xactimate","roomio","schematic","schematic","PB"];
$validProjectsList = array_unique($validProjectsList);
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
  "type": "one of: New Order, Amend, Completion, Issue",
  "order_id": "extracted order number or property address",
  "remark": "extract the reason for issue or completion notes (empty if none)"
}

STRICT RULES — follow exactly:

WHAT IS AN ORDER (is_order: true):
- A message containing a PROPERTY ADDRESS (street, city, state/postcode) ONLY IF it is placing a new order or requesting work.
- A message containing an ORDER NUMBER like #314924, #313583, Order #314888, Portal Order #315052 ONLY IF it is placing a new order, amending, or marking completion/issue.
- A message about creating, amending, or redoing a floor plan, 3D render, photo edit, etc.
- A message asking to "monitor" or "complete" specific order numbers — these ARE orders to track
- A message stating an order is uploaded, completed, or has an issue FOR A SPECIFIC ORDER.

WHAT IS NOT AN ORDER (is_order: false):
- CRITICAL RULE: Any message asking for an ETA, status update, turnaround time, progress, or when an order will be done (e.g., "Can I get an ETA on this order?", "Any ETA?", "Status check please?", "When will this be ready?") MUST BE SET TO is_order: false, EVEN IF IT CONTAINS AN ORDER NUMBER (#XXXXXX) OR ADDRESS.
- Greetings, thank yous, good morning messages with NO order numbers
- General questions with no order numbers like "are these done?", "how is everyone?"
- Internal coordination with NO specific order numbers like "they are due in 2 hours"
- Messages that are just punctuation, emoji, or under 5 words with no address/order number
- File-only uploads with no caption (unless channel context implies all uploads are orders)

DEPARTMENT & PROJECT RULES:
- ONLY set department/project if the message EXPLICITLY mentions a specific one by name.
- If not mentioned, return "Unknown". Do NOT guess — the system will auto-assign from the channel.

TYPE DETERMINATION (CRITICAL):
- Evaluate the ENTIRE message. Do not be fooled by order metadata blocks.
- If the message contains "Uploaded on portal", "Uploaded On Portal", "done", "completed", "ready", "cleared", "this should be done", or "sent" anywhere (especially at the end), type MUST BE "Completion".
- If the message mentions "issue", "missing", "error", "redo", "revision", "changes", type MUST BE "Issue".
- If the message has BOTH "issue/not clear" and "Uploaded on portal", prioritize "Completion" if the overall goal was to deliver the file, or "Issue" if they are blocked. Usually "Uploaded on Portal" means it is done, so use "Completion".
- If it just asks for an amendment, type is "Amend".
- Otherwise, type is "New Order".

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
if (!in_array($type, ['New Order', 'Amend', 'Completion', 'Issue'])) {
    $type = 'New Order';
}

// Completion Rule: If message explicitly states "Uploaded on Portal", "Completed", "Ready", or "Done", force Completion
$hasCompletionPhrase = preg_match('/(uploaded\s+on\s+portal|uploaded\s+to\s+portal|uploaded\s+on\s+crm|uploaded\s+on\s+site|\*uploaded\s+on\s+portal\*|\bcompleted\b|\bready\b|\bdone\b)/i', $cleanText);

if ($hasCompletionPhrase) {
    $type = 'Completion';
    debugLog("Bulletproof rule applied: Completion phrase found ('Uploaded on Portal') -> Forcing Type to Completion");
} else {
    // PHP Safety Rule: Force type to Issue if message is asking to contact customer or missing info/template
    if (preg_match('/\b(ask customer|ask client|email customer|email client|contact customer|contact client|provide template|provide style|provide details|missing|cannot draw|cannot proceed|on hold)\b/i', $cleanText)) {
        $type = 'Issue';
        debugLog("Bulletproof rule applied: Issue phrase found in message -> Type set to Issue");
    }
}

$remark = isset($parsed['remark']) ? trim($parsed['remark']) : '';
if (empty($remark) && $type === 'Issue') {
    $remark = $cleanText;
}
$esc_remark = mysqli_real_escape_string($conn, $remark);

preg_match_all('/#(\d{4,7})/', $cleanText, $orderMatches);
$extractedOrders = array_unique($orderMatches[1]);

if (empty($extractedOrders)) {
    $aiOrderId       = trim($parsed['order_id'] ?? '');
    $extractedOrders = [($aiOrderId !== '') ? $aiOrderId : substr($cleanText, 0, 200)];
}

debugLog("Found " . count($extractedOrders) . " order(s): " . implode(', #', $extractedOrders));

$now   = $ts ? date('Y-m-d H:i:s', intval($ts)) : date('Y-m-d H:i:s');
$date  = $ts ? date('Y-m-d', intval($ts)) : date('Y-m-d');
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

    // Find latest order by ID
    $dup_res = mysqli_query($conn,
        "SELECT id, status FROM `order`
         WHERE `propery-order` = '$esc_orderId'
         AND `department` = '$esc_dept'
         ORDER BY id DESC LIMIT 1"
    );
    
    $existing = null;
    if ($dup_res && mysqli_num_rows($dup_res) > 0) {
        $existing = mysqli_fetch_assoc($dup_res);
    }

    $orderTs     = (count($extractedOrders) > 1) ? $ts . '_' . $singleOrder : $ts;
    $esc_orderTs = mysqli_real_escape_string($conn, $orderTs);

    $insert_res = false;
    $remark_sql = ($esc_remark !== '') ? ", `instruction` = '$esc_remark'" : "";
    
    if ($type === 'Completion') {
        if ($existing) {
            $eid = $existing['id'];
            $insert_res = mysqli_query($conn, "UPDATE `order` SET `status` = 'completed', `query_done` = '$esc_now', `query-first-reply_datetime` = COALESCE(`query-first-reply_datetime`, '$esc_now') $remark_sql WHERE id = '$eid'");
            debugLog("Completion message: updated existing order #$singleOrder to completed and stamped query_done.");
        } else {
            $insert_sql = "INSERT INTO `order`
                (`year`, `month`, `date`, `communication_medium`, `project_name`, `department`,
                 `type`, `propery-order`, `query-received_datetime`, `query-first-reply_datetime`, `inserted_datetime`,
                 `qname`, `status`, `query_done`, `reminder_hours`, `instruction`, `slack_ts`)
                VALUES
                ('$esc_year', '$esc_month', '$esc_date', 'Slack', '$esc_projectName', '$esc_dept',
                 '$esc_type', '$esc_orderId', '$esc_now', '$esc_now', '$esc_now',
                 'Slack Bot', 'completed', '$esc_now', 4, '$esc_remark', '$esc_orderTs')";
            $insert_res = mysqli_query($conn, $insert_sql);
            debugLog("Completion message: created NEW completed order #$singleOrder.");
        }
    } elseif ($type === 'Issue' || $type === 'Amend') {
        if ($existing) {
            $eid = $existing['id'];
            $insert_res = mysqli_query($conn, "UPDATE `order` SET `status` = 'issue' $remark_sql WHERE id = '$eid'");
            debugLog("Issue message: updated existing order #$singleOrder to issue.");
        } else {
            $insert_sql = "INSERT INTO `order`
                (`year`, `month`, `date`, `communication_medium`, `project_name`, `department`,
                 `type`, `propery-order`, `query-received_datetime`, `query-first-reply_datetime`, `inserted_datetime`,
                 `qname`, `status`, `reminder_hours`, `instruction`, `slack_ts`)
                VALUES
                ('$esc_year', '$esc_month', '$esc_date', 'Slack', '$esc_projectName', '$esc_dept',
                 '$esc_type', '$esc_orderId', '$esc_now', NULL, '$esc_now',
                 'Slack Bot', 'issue', 4, '$esc_remark', '$esc_orderTs')";
            $insert_res = mysqli_query($conn, $insert_sql);
            debugLog("Issue message: created NEW issue order #$singleOrder.");
        }
    } else {
        // New Order
        if ($existing && $existing['status'] !== 'completed' && $existing['status'] !== 'issue') {
            debugLog("Duplicate skipped: #$singleOrder (already logged active order).");
            $skippedOrders[] = $singleOrder;
            continue;
        }
        $insert_sql = "INSERT INTO `order`
            (`year`, `month`, `date`, `communication_medium`, `project_name`, `department`,
             `type`, `propery-order`, `query-received_datetime`, `inserted_datetime`,
             `qname`, `status`, `reminder_hours`, `instruction`, `slack_ts`)
            VALUES
            ('$esc_year', '$esc_month', '$esc_date', 'Slack', '$esc_projectName', '$esc_dept',
             '$esc_type', '$esc_orderId', '$esc_now', '$esc_now',
             'Slack Bot', 'pending', 4, '', '$esc_orderTs')";
        $insert_res = mysqli_query($conn, $insert_sql);
    }

    if ($insert_res) {
        $loggedOrders[] = $singleOrder;
        debugLog("✅ LOG/UPDATE SUCCESS for #$singleOrder | Type: $type");
    } else {
        debugLog("❌ DB ERROR for #$singleOrder: " . mysqli_error($conn));
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