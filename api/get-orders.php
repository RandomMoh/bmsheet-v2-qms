<?php
date_default_timezone_set('Asia/Karachi');
ini_set('display_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    exit(0);

include_once 'config.php';
mysqli_set_charset($conn, 'utf8mb4');

$umap = [];
$ures = mysqli_query($conn, "SELECT dusername, dname FROM `user` WHERE dusername IS NOT NULL AND dname IS NOT NULL");
while ($ur = mysqli_fetch_assoc($ures)) {
    $umap[trim($ur['dusername'])] = trim($ur['dname']);
}

$from = isset($_GET['from_date']) && trim($_GET['from_date']) !== '' ? mysqli_real_escape_string($conn, trim($_GET['from_date'])) : '';
$to = isset($_GET['to_date']) && trim($_GET['to_date']) !== '' ? mysqli_real_escape_string($conn, trim($_GET['to_date'])) : '';

$whereClause = "1=1";

if ($from && $to) {
    $whereClause .= " AND `date` >= '$from' AND `date` <= '$to'";
} elseif ($from) {
    $whereClause .= " AND `date` >= '$from'";
} elseif ($to) {
    $whereClause .= " AND `date` <= '$to'";
}

$query = mysqli_query($conn, "SELECT * FROM `order` WHERE $whereClause ORDER BY id DESC LIMIT 5000");

if (!$query) {
    echo json_encode(["status" => "error", "message" => "SQL Error: " . mysqli_error($conn)]);
    exit();
}

$orders = [];
while ($row = mysqli_fetch_assoc($query)) {
    foreach ($row as $key => $value) {
        $row[$key] = mb_convert_encoding((string)$value, 'UTF-8', 'UTF-8');
    }
    $cb = isset($row['completed_by']) ? trim($row['completed_by']) : '';
    if ($cb !== '' && isset($umap[$cb])) {
        $row['completed_by'] = $umap[$cb];
    }
    $orders[] = $row;
}

$json_output = json_encode(["status" => "success", "data" => $orders]);

if ($json_output === false) {
    echo "JSON Crash Reason: " . json_last_error_msg();
    exit();
}

echo $json_output;
?>