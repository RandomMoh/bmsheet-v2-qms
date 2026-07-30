<?php
date_default_timezone_set('Asia/Karachi');

function logActivity($conn, $action, $details = '') {
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 0;
    $username = isset($_SESSION['username']) ? $_SESSION['username'] : 'unknown';
    $role = isset($_SESSION['role']) ? $_SESSION['role'] : 'unknown';
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    $now = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("INSERT INTO `activity_log` (`user_id`, `username`, `role`, `action`, `details`, `ip_address`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssss", $user_id, $username, $role, $action, $details, $ip, $now);
    $stmt->execute();
    $stmt->close();
}

function trackSession($conn) {
    $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 0;
    $username = isset($_SESSION['username']) ? $_SESSION['username'] : 'unknown';
    $role = isset($_SESSION['role']) ? $_SESSION['role'] : 'unknown';
    $session_id = session_id();
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    $now = date('Y-m-d H:i:s');

    $stmt = $conn->prepare("INSERT INTO `active_sessions` (`user_id`, `username`, `role`, `session_id`, `last_active`, `login_time`, `ip_address`) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `last_active` = ?, `username` = ?, `role` = ?");
    $stmt->bind_param("isssssssss", $user_id, $username, $role, $session_id, $now, $now, $ip, $now, $username, $role);
    $stmt->execute();
    $stmt->close();

    $cutoff = date('Y-m-d H:i:s', time() - 1800);
    $conn->query("DELETE FROM `active_sessions` WHERE `last_active` < '$cutoff'");
}
?>
