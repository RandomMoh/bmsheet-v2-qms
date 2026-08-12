<?php
date_default_timezone_set('Asia/Karachi');

$host    = "localhost";
$db_user = "bmsheetv2benchma_admin";
$db_pass = "}B(cMH)z[*g@";
$db_name = "bmsheetv2benchma_qms";

$conn = mysqli_connect($host, $db_user, $db_pass, $db_name);

if (!$conn) {
    http_response_code(500);
    exit('DB error');
}

mysqli_set_charset($conn, 'utf8mb4');

define('GROQ_API_KEY', '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');

define('SLACK_BOT_TOKEN_FALLBACK', '');

function resolveShiftToken($ws_row) {
    $hour = (int)date('G');
    if ($hour >= 8 && $hour < 16) {
        $token = !empty($ws_row['bot_token_shift1']) ? $ws_row['bot_token_shift1'] : null;
    } elseif ($hour >= 16 && $hour <= 23) {
        $token = !empty($ws_row['bot_token_shift2']) ? $ws_row['bot_token_shift2'] : null;
    } else {
        $token = !empty($ws_row['bot_token_shift3']) ? $ws_row['bot_token_shift3'] : null;
    }
    if (!$token) $token = !empty($ws_row['bot_token_shift1']) ? $ws_row['bot_token_shift1'] : null;
    if (!$token) $token = !empty($ws_row['bot_token_shift2']) ? $ws_row['bot_token_shift2'] : null;
    if (!$token) $token = !empty($ws_row['bot_token_shift3']) ? $ws_row['bot_token_shift3'] : null;
    return $token ?: SLACK_BOT_TOKEN_FALLBACK;
}
