<?php
error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['status' => 'error', 'message' => 'POST only']); exit(); }

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->field) || !isset($data->value)) {
    echo json_encode(['status' => 'error', 'message' => 'Missing id, field, or value']); exit();
}

$allowed = ['project_name', 'department'];
if (!in_array($data->field, $allowed) && !isSuperAdmin()) {
    echo json_encode(['status' => 'error', 'message' => 'Field not allowed']); exit();
}

$id    = (int)$data->id;
$field = $data->field;
$value = mysqli_real_escape_string($conn, trim($data->value));
$changedBy = isset($data->changed_by) ? mysqli_real_escape_string($conn, trim($data->changed_by)) : 'Admin';
$now   = date('Y-m-d H:i:s');

$oldRes = mysqli_query($conn, "SELECT `$field` FROM `order` WHERE `id` = $id");
$oldRow = $oldRes ? mysqli_fetch_assoc($oldRes) : null;
$oldValue = $oldRow ? $oldRow[$field] : null;

$sql = "UPDATE `order` SET `$field` = '$value' WHERE `id` = $id";
if (mysqli_query($conn, $sql)) {
    logActivity('Update Field', "Updated $field to '$value' for order #$id");

    if ($oldValue !== $value) {
        $oldEsc = mysqli_real_escape_string($conn, $oldValue ?? '');
        mysqli_query($conn, "INSERT INTO `query_history` (`order_id`, `changed_by`, `action`, `field_changed`, `old_value`, `new_value`, `timestamp_pkt`)
            VALUES ($id, '$changedBy', 'Field Updated', '$field', " . ($oldEsc === '' ? 'NULL' : "'$oldEsc'") . ", '$value', '$now')");
    }

    echo json_encode(['status' => 'success', 'message' => 'Field updated']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . mysqli_error($conn)]);
}

mysqli_close($conn);
