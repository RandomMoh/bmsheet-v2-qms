<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$result = mysqli_query($conn, "SELECT `dname` FROM `user` WHERE `dname` IS NOT NULL AND `dname` != '' ORDER BY `dname` ASC");

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    exit();
}

$names = [];
while ($row = mysqli_fetch_assoc($result)) {
    $names[] = $row['dname'];
}

echo json_encode($names);
mysqli_close($conn);