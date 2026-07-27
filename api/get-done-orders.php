<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$from = isset($_GET['from_date']) && trim($_GET['from_date']) !== '' ? mysqli_real_escape_string($conn, $_GET['from_date']) : '';
$to = isset($_GET['to_date']) && trim($_GET['to_date']) !== '' ? mysqli_real_escape_string($conn, $_GET['to_date']) : '';

$where = "`query_done` IS NOT NULL";

if ($from && $to) {
    $where .= " AND `date` >= '$from' AND `date` <= '$to'";
} elseif ($from) {
    $where .= " AND `date` >= '$from'";
} elseif ($to) {
    $where .= " AND `date` <= '$to'";
} else {
    $where .= " AND `query_done` >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
}

$result = mysqli_query($conn, "SELECT * FROM `order` WHERE $where ORDER BY id DESC");

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