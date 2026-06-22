<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$result = mysqli_query($conn, "SELECT * FROM `order` WHERE `status` = 'issue' ORDER BY id DESC");

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    exit();
}

$orders = [];
while ($row = mysqli_fetch_assoc($result)) {
    $orders[] = $row;
}

echo json_encode($orders);
mysqli_close($conn);