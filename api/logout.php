<?php
require_once 'config.php';

$userId = intval($_SESSION['user_id'] ?? 0);
if ($userId > 0) {
    $conn->query("DELETE FROM `active_sessions` WHERE `user_id` = $userId");
}

session_unset();
session_destroy();

echo json_encode(["status" => "success", "message" => "Logged out securely."]);
?>
