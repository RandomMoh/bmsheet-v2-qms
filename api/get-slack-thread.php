<?php
include 'config.php';

if (!isset($_GET['ts']) || empty($_GET['ts'])) {
    echo json_encode(["status" => "error", "message" => "Missing slack_ts"]);
    exit;
}

$ts = $_GET['ts'];

if (!preg_match('/^[0-9]+\.[0-9]+$/', $ts)) {
    echo json_encode(["status" => "error", "message" => "Invalid slack_ts format"]);
    exit;
}

$hour = (int)date('G');

$channel_sql = "
    SELECT c.channel_id, w.bot_token_shift1, w.bot_token_shift2, w.bot_token_shift3
    FROM slack_channels c
    LEFT JOIN slack_workspaces w ON c.workspace_id = w.id
    WHERE c.is_active = 1
";
$channel_res = mysqli_query($conn, $channel_sql);
$channels = [];
if ($channel_res) {
    while ($row = mysqli_fetch_assoc($channel_res)) {
        $channels[] = $row;
    }
}

if (empty($channels)) {
    echo json_encode(["status" => "error", "message" => "No active channels to search"]);
    exit;
}

$found_messages = null;

foreach ($channels as $c_row) {
    $channel_id = $c_row['channel_id'];
    if (!preg_match('/^[A-Z0-9]+$/', $channel_id)) continue;
    
    if ($hour >= 8 && $hour < 16) {
        $token = !empty($c_row['bot_token_shift1']) ? $c_row['bot_token_shift1'] : SLACK_TOKEN_SHIFT1;
    } elseif ($hour >= 16 && $hour <= 23) {
        $token = !empty($c_row['bot_token_shift2']) ? $c_row['bot_token_shift2'] : SLACK_TOKEN_SHIFT2;
    } else {
        $token = !empty($c_row['bot_token_shift3']) ? $c_row['bot_token_shift3'] : SLACK_TOKEN_SHIFT3;
    }
    
    $url = "https://slack.com/api/conversations.replies?channel={$channel_id}&ts={$ts}";
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'Authorization: Bearer ' . $token
        ],
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $res = curl_exec($ch);
    curl_close($ch);
    
    if ($res) {
        $data = json_decode($res, true);
        if (isset($data['ok']) && $data['ok'] === true && !empty($data['messages'])) {
            $found_messages = $data['messages'];
            break; // Found the thread!
        }
    }
}

if ($found_messages) {
    $clean_messages = [];
    foreach ($found_messages as $msg) {
        $user_id = isset($msg['user']) ? $msg['user'] : (isset($msg['bot_id']) ? $msg['bot_id'] : 'Unknown');
        
        $text = $msg['text'];
        $text = preg_replace('/<@[A-Z0-9]+>/i', '@user', $text);
        $text = preg_replace('/<#[A-Z0-9]+\|([^>]+)>/i', '#$1', $text);
        $text = preg_replace('/<(https?:\/\/[^|>]+)\|([^>]+)>/i', '$2', $text);
        $text = preg_replace('/<(https?:\/\/[^>]+)>/i', '$1', $text);
        
        $clean_messages[] = [
            'user' => $user_id,
            'text' => trim($text),
            'ts' => $msg['ts'],
            'date' => date('M d, H:i', (int)$msg['ts'])
        ];
    }
    
    echo json_encode(["status" => "success", "messages" => $clean_messages]);
} else {
    echo json_encode(["status" => "error", "message" => "Thread not found in any active channel"]);
}
