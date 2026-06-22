<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$result_csr = mysqli_query($conn, "SELECT d_id as id, dname as name, dusername as username, dstatus as status, 'csr' as role FROM `user` ORDER BY d_id DESC");
if (!$result_csr) {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    exit();
}

$users = [];
while ($row = mysqli_fetch_assoc($result_csr)) {
    $users[] = $row;
}

$result_admin = mysqli_query($conn, "SELECT id, name, username, 'yes' as status, 'admin' as role FROM `admin` ORDER BY id DESC");
if ($result_admin) {
    while ($row = mysqli_fetch_assoc($result_admin)) {
        $users[] = $row;
    }
}

echo json_encode(['status' => 'success', 'data' => $users]);
mysqli_close($conn);