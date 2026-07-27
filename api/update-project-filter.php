<?php
include_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'user') {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->projects) || !is_array($data->projects)) {
    echo json_encode(["status" => "error", "message" => "Missing or invalid projects array"]);
    exit();
}

$projects_json = mysqli_real_escape_string($conn, json_encode($data->projects));
$user_id = (int)$_SESSION['user_id'];

$q = mysqli_query($conn, "UPDATE user SET project_filter = '$projects_json' WHERE d_id = $user_id");

if ($q) {
    echo json_encode(["status" => "success", "message" => "Filter updated successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Database error: " . mysqli_error($conn)]);
}
?>
