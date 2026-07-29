<?php
date_default_timezone_set('Asia/Karachi');
include_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$userId = intval($data['user_id'] ?? $_SESSION['user_id'] ?? 0);
$username = trim($data['username'] ?? $_SESSION['username'] ?? '');
$role = trim($data['userRole'] ?? $_SESSION['role'] ?? 'CSR');
$sessId = session_id() ?: ('sess_' . $userId);
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$now = date('Y-m-d H:i:s');

if ($userId > 0 && !empty($username)) {
    $stmt = $conn->prepare("INSERT INTO `active_sessions` (`user_id`, `username`, `role`, `session_id`, `last_active`, `login_time`, `ip_address`) 
        VALUES (?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE `last_active` = ?, `username` = ?, `role` = ?");
    $stmt->bind_param("isssssssss", $userId, $username, $role, $sessId, $now, $now, $ip, $now, $username, $role);
    $stmt->execute();
    $stmt->close();
}

// Clean old sessions older than 30 minutes
$conn->query("DELETE FROM `active_sessions` WHERE `last_active` < DATE_SUB(NOW(), INTERVAL 30 MINUTE)");

echo json_encode(['status' => 'success', 'timestamp' => $now]);
?>
