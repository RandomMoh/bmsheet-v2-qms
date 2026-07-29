<?php
include 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$name = trim($data['name'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($name) || empty($password)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing fields']);
    exit;
}

$configFile = __DIR__ . '/login_maker_config.json';
if (!file_exists($configFile)) {
    echo json_encode(['status' => 'error', 'message' => 'Configuration not found']);
    exit;
}

$config = json_decode(file_get_contents($configFile), true);
if ($password !== $config['login_maker_password']) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid senior authorization']);
    exit;
}

$base_name = trim(preg_replace('/\bcsr\b/i', '', $name));
$username = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', trim($base_name)));

// Generate a strong 8-character password
$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
$userPassword = '';
for ($i = 0; $i < 8; $i++) {
    $userPassword .= $chars[rand(0, strlen($chars) - 1)];
}

$stmt = $conn->prepare("SELECT d_id FROM user WHERE dusername = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows > 0) {
    $username .= rand(10, 99);
}
$stmt->close();

// Hash the password for dpassword, store plain in plain_password
$hashedPassword = password_hash($userPassword, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO user (dusername, dname, dpassword, plain_password, dstatus, role) VALUES (?, ?, ?, ?, '1', 'CSR')");
$stmt->bind_param("ssss", $username, $name, $hashedPassword, $userPassword);

if ($stmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'username' => $username,
        'password' => $userPassword  // Return plain text so it can be sent to the new CSR
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
}
$stmt->close();
?>
