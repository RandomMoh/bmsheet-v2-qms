<?php
include 'config.php';

if (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized dev access"]);
    exit;
}

$res = mysqli_query($conn, "SELECT remaining_requests, remaining_tokens, last_updated FROM api_usage WHERE id=1");
if ($res && mysqli_num_rows($res) > 0) {
    $row = mysqli_fetch_assoc($res);
    echo json_encode($row);
} else {
    echo json_encode(["remaining_requests" => 0, "remaining_tokens" => 0, "last_updated" => null]);
}
?>
