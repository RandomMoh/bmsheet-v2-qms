<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
include 'config.php';

if (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$newPass = isset($data['new_password']) ? trim($data['new_password']) : '';

if (strlen($newPass) < 8) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Password must be at least 8 characters"]);
    exit;
}

$configFile = __DIR__ . '/login_maker_config.json';
$config = json_decode(file_get_contents($configFile), true);

$config['dev_password'] = $newPass;

if (file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
    echo json_encode(["status" => "success", "message" => "Password updated successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to write new password to file"]);
}
?>
