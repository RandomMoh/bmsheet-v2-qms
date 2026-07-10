<?php
include 'config.php';

// Auth check
if (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized dev access"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $res = mysqli_query($conn, "SELECT * FROM slack_channels ORDER BY id DESC");
    $channels = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $channels[] = $row;
    }
    echo json_encode($channels);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $channel_id = mysqli_real_escape_string($conn, $data['channel_id']);
    $channel_name = mysqli_real_escape_string($conn, $data['channel_name']);
    $workspace_id = isset($data['workspace_id']) && $data['workspace_id'] !== '' ? (int)$data['workspace_id'] : 'NULL';
    $default_project = mysqli_real_escape_string($conn, $data['default_project'] ?? '');
    $default_department = mysqli_real_escape_string($conn, $data['default_department'] ?? '');
    $hint = mysqli_real_escape_string($conn, $data['hint'] ?? '');
    $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;

    if (isset($data['id'])) {
        // Update
        $id = (int)$data['id'];
        $sql = "UPDATE slack_channels SET channel_id='$channel_id', channel_name='$channel_name', workspace_id=$workspace_id, default_project='$default_project', default_department='$default_department', hint='$hint', is_active=$is_active WHERE id=$id";
    } else {
        // Insert
        $sql = "INSERT INTO slack_channels (channel_id, channel_name, workspace_id, default_project, default_department, hint, is_active) VALUES ('$channel_id', '$channel_name', $workspace_id, '$default_project', '$default_department', '$hint', $is_active)";
    }
    if (mysqli_query($conn, $sql)) {
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(500);
        error_log(mysqli_error($conn)); echo json_encode(["status" => "error", "message" => "Database error"]);
    }
} elseif ($method === 'DELETE') {
    // Some frameworks send DELETE payload in input stream
    $data = json_decode(file_get_contents('php://input'), true);
    // If not in body, check query params
    if (!$data && isset($_GET['id'])) {
        $data = ['id' => $_GET['id']];
    }
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id > 0) {
        mysqli_query($conn, "DELETE FROM slack_channels WHERE id=$id");
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid ID"]);
    }
}
?>
