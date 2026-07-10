<?php
// ═══════════════════════════════════════════════════════════════
// WEBHOOK-ONLY CONFIG — No session, no auth shield.
// The webhook is called by Slack's servers, not by a browser.
// Sessions are meaningless here and just add overhead.
// ═══════════════════════════════════════════════════════════════
date_default_timezone_set('Asia/Karachi');

// DB connection
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

// API keys
define('GROQ_API_KEY', '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');

// Fallback token only used if workspace lookup fails entirely
define('SLACK_BOT_TOKEN_FALLBACK', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH');

// ─── Shift-based token resolver ───────────────────────────────
// Shift 1: 08:00 – 15:59 PKT
// Shift 2: 16:00 – 23:59 PKT
// Shift 3: 00:00 – 07:59 PKT (overnight)
function resolveShiftToken($ws_row) {
    $hour = (int)date('G');
    if ($hour >= 8 && $hour < 16) {
        $token = !empty($ws_row['bot_token_shift1']) ? $ws_row['bot_token_shift1'] : null;
    } elseif ($hour >= 16 && $hour <= 23) {
        $token = !empty($ws_row['bot_token_shift2']) ? $ws_row['bot_token_shift2'] : null;
    } else {
        $token = !empty($ws_row['bot_token_shift3']) ? $ws_row['bot_token_shift3'] : null;
    }
    // Cascade: if this shift has no token, fall back through the others
    if (!$token) $token = !empty($ws_row['bot_token_shift1']) ? $ws_row['bot_token_shift1'] : null;
    if (!$token) $token = !empty($ws_row['bot_token_shift2']) ? $ws_row['bot_token_shift2'] : null;
    if (!$token) $token = !empty($ws_row['bot_token_shift3']) ? $ws_row['bot_token_shift3'] : null;
    return $token ?: SLACK_BOT_TOKEN_FALLBACK;
}
