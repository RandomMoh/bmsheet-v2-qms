<?php
error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true);

if (!$body || !isset($body['order_id']) || !isset($body['extra_hours'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing order_id or extra_hours']);
    exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$id = mysqli_real_escape_string($conn, $body['order_id']);
$extra = (float)$body['extra_hours'];

$query = mysqli_query($conn, "SELECT `query-received_datetime`, `reminder_hours` FROM `order` WHERE `id` = '$id'");
$row = mysqli_fetch_assoc($query);

if (!$row) {
    echo json_encode(['status' => 'error', 'message' => 'Order not found']);
    exit();
}

$recTime = strtotime($row['query-received_datetime']);
$currentHours = ($row['reminder_hours'] !== null && (float)$row['reminder_hours'] > 0) ? (float)$row['reminder_hours'] : 4.0;
$now = time();

$currentDeadline = $recTime + ($currentHours * 3600);

if ($now > $currentDeadline) {
    $hoursPassed = ($now - $recTime) / 3600;
    $newReminder = $hoursPassed + $extra;
}
else {
    $newReminder = $currentHours + $extra;
}

$newReminder = mysqli_real_escape_string($conn, $newReminder);
$sql = "UPDATE `order` SET `reminder_hours` = '$newReminder' WHERE `id` = '$id'";

if (mysqli_query($conn, $sql)) {
    logActivity('Extend Time', "Extended time by $extra hours for order #$id");
    echo json_encode(['status' => 'success', 'message' => 'Deadline extended successfully']);
}
else {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
}

mysqli_close($conn);