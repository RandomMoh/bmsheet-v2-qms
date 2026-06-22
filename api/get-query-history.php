<?php
error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

header('Content-Type: application/json; charset=UTF-8');
mysqli_set_charset($conn, 'utf8mb4');

$order_id = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
if (!$order_id) { echo json_encode(['status' => 'error', 'message' => 'Missing order_id']); exit(); }

$res = mysqli_query($conn, "SELECT * FROM `query_history` WHERE `order_id` = $order_id ORDER BY `timestamp_pkt` ASC");
if (!$res) { echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]); exit(); }

$rows = [];
while ($row = mysqli_fetch_assoc($res)) {
    $rows[] = $row;
}

echo json_encode(['status' => 'success', 'data' => $rows]);
mysqli_close($conn);
