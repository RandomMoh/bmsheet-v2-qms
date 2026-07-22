<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
include 'config.php';

// Only authenticated Dev Terminal sessions can retrieve these
if (!isset($_SESSION['dev_auth']) || !$_SESSION['dev_auth']) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$configFile = __DIR__ . '/portal_access_config.json';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Config not found']);
    exit;
}

$config = json_decode(file_get_contents($configFile), true);
echo json_encode([
    'status' => 'success',
    'csr_password'   => $config['csr_password'],
    'admin_password' => $config['admin_password']
]);
?>
