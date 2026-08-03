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

if (!isset($data->id)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user ID']);
    exit();
}

$id = (int)$data->id;

$currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
if (!isAdmin() && $currentUserId !== $id) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden. You are not authorized to modify this user.']);
    exit();
}

$check = mysqli_query($conn, "SELECT d_id FROM `user` WHERE d_id = $id");
if (mysqli_num_rows($check) === 0) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit();
}

$fields = [];
if (isset($data->name) && trim($data->name) !== '') {
    $name = mysqli_real_escape_string($conn, trim($data->name));
    $fields[] = "`dname` = '$name'";
}
if (isset($data->username) && trim($data->username) !== '') {
    $username = mysqli_real_escape_string($conn, trim($data->username));
    $dupCheck = mysqli_query($conn, "SELECT d_id FROM `user` WHERE `dusername` = '$username' AND d_id != $id");
    if (mysqli_num_rows($dupCheck) > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Username already taken']);
        exit();
    }
    $fields[] = "`dusername` = '$username'";
}
if (isset($data->password) && trim($data->password) !== '') {
    $password = mysqli_real_escape_string($conn, trim($data->password));
    $fields[] = "`dpassword` = '$password'";
}
if (isset($data->status)) {
    $status = mysqli_real_escape_string($conn, $data->status);
    $fields[] = "`dstatus` = '$status'";
}

if (empty($fields)) {
    echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
    exit();
}

$sql = "UPDATE `user` SET " . implode(', ', $fields) . " WHERE d_id = $id";

if (mysqli_query($conn, $sql)) {
    echo json_encode(['status' => 'success', 'message' => 'CSR updated successfully']);
}
else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . mysqli_error($conn)]);
}

mysqli_close($conn);