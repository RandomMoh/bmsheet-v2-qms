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

if (!isset($data->name) || !isset($data->username) || !isset($data->password)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields: name, username, password']);
    exit();
}

$name = mysqli_real_escape_string($conn, trim($data->name));
$username = mysqli_real_escape_string($conn, trim($data->username));
$password = trim($data->password);

$check = mysqli_query($conn, "SELECT d_id FROM `user` WHERE `dusername` = '$username'");
if (mysqli_num_rows($check) > 0) {
    echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
    exit();
}

$sql = "INSERT INTO `user` (dname, dusername, dpassword, dstatus) VALUES ('$name', '$username', '$password', 'yes')";

if (mysqli_query($conn, $sql)) {
    logActivity('Add CSR', "Added new CSR user: $name ($username)");
    echo json_encode(['status' => 'success', 'message' => 'CSR account created successfully', 'id' => mysqli_insert_id($conn)]);
}
else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . mysqli_error($conn)]);
}

mysqli_close($conn);