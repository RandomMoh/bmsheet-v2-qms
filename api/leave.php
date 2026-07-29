<?php
date_default_timezone_set('Asia/Karachi');
include_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$userId = intval($data['user_id'] ?? $_SESSION['user_id'] ?? 0);
$username = trim($data['username'] ?? $_SESSION['username'] ?? '');

if ($userId > 0) {
    $conn->query("DELETE FROM `active_sessions` WHERE `user_id` = $userId");
} elseif (!empty($username)) {
    $esc_u = mysqli_real_escape_string($conn, strtolower($username));
    $conn->query("DELETE FROM `active_sessions` WHERE LOWER(`username`) = '$esc_u'");
}

echo json_encode(['status' => 'success']);
?>
