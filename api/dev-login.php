<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}
include 'config.php';

$data = json_decode(file_get_contents("php://input"));
$password = isset($data->password) ? $data->password : '';

$configFile = __DIR__ . '/login_maker_config.json';
$config = json_decode(file_get_contents($configFile), true);

if ($password === $config['dev_password']) {
    $_SESSION['dev_auth'] = true;
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid password']);
}
?>
