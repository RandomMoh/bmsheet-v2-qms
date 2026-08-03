<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'POST only']);
    exit();
}

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden. Admin privileges required.']);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user ID']);
    exit();
}

$id = (int)$data->id;

$check = mysqli_query($conn, "SELECT d_id FROM `user` WHERE d_id = $id");
if (mysqli_num_rows($check) === 0) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit();
}

if (mysqli_query($conn, "DELETE FROM `user` WHERE d_id = $id")) {
    logActivity('Delete CSR', "Deleted CSR user ID: $id");
    echo json_encode(['status' => 'success', 'message' => 'CSR removed successfully']);
}
else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . mysqli_error($conn)]);
}

mysqli_close($conn);