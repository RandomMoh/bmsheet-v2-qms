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
if (!$body) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid or empty JSON payload']);
    exit();
}

$required = ['medium', 'project', 'department', 'type', 'order_id', 'qname'];
foreach ($required as $field) {
    if (!isset($body[$field]) || trim($body[$field]) === '') {
        echo json_encode(['status' => 'error', 'message' => "Missing required field: $field"]);
        exit();
    }
}

mysqli_set_charset($conn, 'utf8mb4');

$medium = mysqli_real_escape_string($conn, trim($body['medium']));
$project = mysqli_real_escape_string($conn, trim($body['project']));
$department = mysqli_real_escape_string($conn, trim($body['department']));
$type = mysqli_real_escape_string($conn, trim($body['type']));
$order_id = mysqli_real_escape_string($conn, trim($body['order_id']));
$qname = mysqli_real_escape_string($conn, trim($body['qname']));
$reminder = isset($body['reminder_hours']) ? (float)$body['reminder_hours'] : 4.0;

$dup = mysqli_query($conn, "SELECT id FROM `order` WHERE `propery-order` = '$order_id' AND `department` = '$department' AND `query_done` IS NULL AND (`status` IS NULL OR `status` != 'issue') LIMIT 1");
if ($dup && mysqli_num_rows($dup) > 0) {
    echo json_encode(['status' => 'error', 'message' => "Duplicate: Order '$order_id' already exists in the queue"]);
    mysqli_close($conn);
    exit();
}

$date = date('Y-m-d');
$year = date('Y');
$month = date('m');
$now = date('Y-m-d H:i:s');
$recv = isset($body['received_datetime']) && trim($body['received_datetime']) !== '' ? mysqli_real_escape_string($conn, trim($body['received_datetime'])) : $now;
$firstReply = isset($body['first_reply_datetime']) && trim($body['first_reply_datetime']) !== '' ? "'" . mysqli_real_escape_string($conn, trim($body['first_reply_datetime'])) . "'" : "NULL";

$sql = "INSERT INTO `order`
    (`date`, `year`, `month`, `inserted_datetime`, `communication_medium`, `project_name`, `department`, `type`, `propery-order`, `query-received_datetime`, `query-first-reply_datetime`, `qname`, `reminder_hours`)
    VALUES
    ('$date', '$year', '$month', '$now', '$medium', '$project', '$department', '$type', '$order_id', '$recv', $firstReply, '$qname', '$reminder')";

if (mysqli_query($conn, $sql)) {
    $newId = mysqli_insert_id($conn);
    logActivity('Add Order', "Added new order: #$order_id ($project - $department)");
    $now_esc = mysqli_real_escape_string($conn, $now);
    $qname_esc = mysqli_real_escape_string($conn, $body['qname']);
    $order_id_esc = mysqli_real_escape_string($conn, $body['order_id']);
    mysqli_query($conn, "INSERT INTO `query_history` (`order_id`, `changed_by`, `action`, `field_changed`, `old_value`, `new_value`, `timestamp_pkt`)
        VALUES ($newId, '$qname_esc', 'Query Created', 'status', NULL, 'pending', '$now_esc')");
    echo json_encode(['status' => 'success', 'message' => 'Query added successfully']);
}
else {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
}

mysqli_close($conn);