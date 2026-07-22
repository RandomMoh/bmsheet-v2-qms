<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
include 'config.php';

// Only authenticated Dev Terminal sessions can grant a bypass
if (!isset($_SESSION['dev_auth']) || !$_SESSION['dev_auth']) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

// Set a short-lived bypass cookie (10 minutes) — same domain, https only
setcookie(
    'qms_dev_bypass',
    '1',
    [
        'expires'  => time() + 600,
        'path'     => '/qms_react/',
        'secure'   => true,
        'httponly' => false,  // JS doesn't need to read it — Apache does
        'samesite' => 'None'
    ]
);

echo json_encode(['status' => 'success']);
?>
