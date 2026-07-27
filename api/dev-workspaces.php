<?php
include 'config.php';

if (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized dev access"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $res = mysqli_query($conn, "SELECT * FROM slack_workspaces ORDER BY id ASC");
    $workspaces = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $workspaces[] = $row;
    }
    echo json_encode($workspaces);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $team_id = mysqli_real_escape_string($conn, $data['team_id'] ?? '');
    $team_name = mysqli_real_escape_string($conn, $data['team_name'] ?? '');
    $bot_token_shift1 = mysqli_real_escape_string($conn, $data['bot_token_shift1'] ?? '');
    $bot_token_shift2 = mysqli_real_escape_string($conn, $data['bot_token_shift2'] ?? '');
    $bot_token_shift3 = mysqli_real_escape_string($conn, $data['bot_token_shift3'] ?? '');

    if (isset($data['id'])) {
        $id = (int)$data['id'];
        $sql = "UPDATE slack_workspaces SET team_id='$team_id', team_name='$team_name', bot_token_shift1='$bot_token_shift1', bot_token_shift2='$bot_token_shift2', bot_token_shift3='$bot_token_shift3' WHERE id=$id";
    } else {
        $sql = "INSERT INTO slack_workspaces (team_id, team_name, bot_token_shift1, bot_token_shift2, bot_token_shift3) VALUES ('$team_id', '$team_name', '$bot_token_shift1', '$bot_token_shift2', '$bot_token_shift3')";
    }
    if (mysqli_query($conn, $sql)) {
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(500);
        error_log(mysqli_error($conn)); 
        echo json_encode(["status" => "error", "message" => "Database error"]);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data && isset($_GET['id'])) {
        $data = ['id' => $_GET['id']];
    }
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    
    $res = mysqli_query($conn, "SELECT id FROM slack_channels WHERE workspace_id=$id LIMIT 1");
    if (mysqli_num_rows($res) > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Cannot delete workspace that is in use by channels"]);
        exit;
    }

    if ($id > 0) {
        mysqli_query($conn, "DELETE FROM slack_workspaces WHERE id=$id");
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid ID"]);
    }
}
?>
