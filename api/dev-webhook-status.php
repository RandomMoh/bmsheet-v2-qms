<?php
include 'config.php';

if (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized dev access"]);
    exit;
}

$statusFile = __DIR__ . '/webhook-status.json';

// Ensure file exists
if (!file_exists($statusFile)) {
    file_put_contents($statusFile, json_encode(["paused" => false]));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['paused'])) {
        $newState = [ "paused" => (bool)$input['paused'] ];
        file_put_contents($statusFile, json_encode($newState));
        echo json_encode(["status" => "success", "paused" => $newState['paused']]);
        exit;
    }
}

// Handle GET
$data = json_decode(file_get_contents($statusFile), true);
if (!$data || !isset($data['paused'])) {
    $data = ["paused" => false];
}
echo json_encode($data);
?>
