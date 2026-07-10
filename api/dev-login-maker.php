<?php
include 'config.php';

if (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized dev access"]);
    exit;
}

$configFile = __DIR__ . '/login_maker_config.json';
if (!file_exists($configFile)) {
    file_put_contents($configFile, json_encode(["login_maker_password" => "senior_secret_123"]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($data['new_password']) && strlen($data['new_password']) >= 6) {
        file_put_contents($configFile, json_encode(["login_maker_password" => $data['new_password']]));
        echo json_encode(["status" => "success", "message" => "UPDATED_SUCCESSFULLY"]);
    } else {
        echo json_encode(["status" => "error", "message" => "INVALID_PASSWORD"]);
    }
    exit;
}

$config = json_decode(file_get_contents($configFile), true);
echo json_encode(["status" => "success", "password" => $config['login_maker_password']]);
?>
