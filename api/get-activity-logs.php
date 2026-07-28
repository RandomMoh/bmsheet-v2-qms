<?php
error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if (!isSuperAdmin() && (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true)) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized Access. Super Admin or Dev required.']);
    exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$sql = "SELECT * FROM `activity_logs` ORDER BY `id` DESC LIMIT 1000";
$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    exit();
}

$logs = [];
while ($row = mysqli_fetch_assoc($result)) {
    $logs[] = $row;
}

echo json_encode(['status' => 'success', 'data' => $logs]);
mysqli_close($conn);
