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

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->display_name) || !isset($data->login_name) || !isset($data->password)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit();
}

$display_name = mysqli_real_escape_string($conn, trim($data->display_name));
$login_name = mysqli_real_escape_string($conn, trim($data->login_name));
$password = password_hash($data->password, PASSWORD_BCRYPT);
$role = isset($data->role) && in_array($data->role, ['admin', 'super_admin']) ? $data->role : 'admin';

$check = mysqli_query($conn, "SELECT id FROM `admin` WHERE `name` = '$login_name'");
if (mysqli_num_rows($check) > 0) {
    echo json_encode(['status' => 'error', 'message' => 'Admin login name already exists']);
    exit();
}

$sql = "INSERT INTO `admin` (username, name, password, type) VALUES ('$display_name', '$login_name', '$password', '$role')";

if (mysqli_query($conn, $sql)) {
    echo json_encode(['status' => 'success', 'message' => 'Admin account created successfully', 'id' => mysqli_insert_id($conn)]);
}
else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . mysqli_error($conn)]);
}

mysqli_close($conn);