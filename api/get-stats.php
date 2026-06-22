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

if (!empty($from) && !empty($to)) {
    $dateFilter = "DATE(`date`) BETWEEN '$from' AND '$to'";
}
elseif (!empty($from)) {
    $dateFilter = "DATE(`date`) >= '$from'";
}
elseif (!empty($to)) {
    $dateFilter = "DATE(`date`) <= '$to'";
}
else {
    $today = date('Y-m-d');
    $dateFilter = "`date`='$today'";
}

$stats = [
    'total_received' => 0, 'total_new' => 0, 'total_amend' => 0,
    'issues' => 0, 'issue_new' => 0, 'issue_amend' => 0,
    'done' => 0, 'done_new' => 0, 'done_amend' => 0,
    'pending' => 0, 'pending_new' => 0, 'pending_amend' => 0,
    'date' => !empty($from) ? "$from to $to" : date('Y-m-d'),
];

$queries = [
    'total_received' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter",
    'total_new' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `type`='New Order'",
    'total_amend' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `type`='Amend'",
    'issues' => "SELECT COUNT(*) as c FROM `order` WHERE `status`='issue'",
    'issue_new' => "SELECT COUNT(*) as c FROM `order` WHERE `status`='issue' AND `type` LIKE '%New%'",
    'issue_amend' => "SELECT COUNT(*) as c FROM `order` WHERE `status`='issue' AND `type` LIKE '%Amend%'",
    'done' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `query_done` IS NOT NULL",
    'done_new' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `type`='New Order' AND `query_done` IS NOT NULL",
    'done_amend' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `type`='Amend' AND `query_done` IS NOT NULL",
    'pending' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `query_done` IS NULL",
    'pending_new' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `type`='New Order' AND `query_done` IS NULL",
    'pending_amend' => "SELECT COUNT(*) as c FROM `order` WHERE $dateFilter AND `type`='Amend' AND `query_done` IS NULL",
];

foreach ($queries as $key => $sql) {
    $result = mysqli_query($conn, $sql);
    if ($result) {
        $row = mysqli_fetch_assoc($result);
        $stats[$key] = (int)$row['c'];
    }
}

echo json_encode($stats);
mysqli_close($conn);