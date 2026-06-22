<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$from = isset($_GET['from_date']) ? mysqli_real_escape_string($conn, $_GET['from_date']) : '';
$to = isset($_GET['to_date']) ? mysqli_real_escape_string($conn, $_GET['to_date']) : '';

$where = "`query_done` IS NULL AND (`status` != 'issue' OR `status` IS NULL)";

if (!empty($from) && !empty($to)) {
    $where .= " AND DATE(`date`) BETWEEN '$from' AND '$to'";
}
elseif (!empty($from)) {
    $where .= " AND DATE(`date`) >= '$from'";
}
elseif (!empty($to)) {
    $where .= " AND DATE(`date`) <= '$to'";
}

$result = mysqli_query($conn, "SELECT * FROM `order` WHERE $where ORDER BY id ASC");

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    exit();
}

$orders = [];
while ($row = mysqli_fetch_assoc($result)) {
    $limitHours = (isset($row['reminder_hours']) && (float)$row['reminder_hours'] > 0) ? (float)$row['reminder_hours'] : 4.0;
    $recTimestamp = strtotime($row['query-received_datetime']);
    $row['_deadline'] = $recTimestamp + (int)($limitHours * 3600);
    $row['_halfway'] = $recTimestamp + (int)(($limitHours / 2) * 3600);
    $row['_limit_hours'] = $limitHours;
    $orders[] = $row;
}

echo json_encode($orders);
mysqli_close($conn);