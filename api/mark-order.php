<?php
error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { echo json_encode(['status' => 'error', 'message' => 'Method not allowed']); exit(); }

$body = json_decode(file_get_contents('php://input'), true);
if (!$body || !isset($body['id']) || !isset($body['action'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing id or action']); exit();
}

mysqli_set_charset($conn, 'utf8mb4');

$id     = mysqli_real_escape_string($conn, $body['id']);
$action = $body['action'];
$instruction = isset($body['instruction']) ? mysqli_real_escape_string($conn, $body['instruction']) : '';
$user   = isset($body['completed_by']) ? mysqli_real_escape_string($conn, $body['completed_by']) : '';
$now    = date('Y-m-d H:i:s');

// Fetch current state BEFORE update for diff tracking
$checkSql = mysqli_query($conn, "SELECT `status`, `completed_by`, `instruction` FROM `order` WHERE `id` = '$id'");
$current  = mysqli_fetch_assoc($checkSql);

if (!$current) {
    echo json_encode(['status' => 'error', 'message' => 'Order not found']); exit();
}

function logHistory($conn, $id, $changedBy, $action, $field, $oldVal, $newVal, $now) {
    $changedBy = mysqli_real_escape_string($conn, $changedBy);
    $action    = mysqli_real_escape_string($conn, $action);
    $field     = mysqli_real_escape_string($conn, $field);
    $oldVal    = mysqli_real_escape_string($conn, $oldVal ?? '');
    $newVal    = mysqli_real_escape_string($conn, $newVal ?? '');
    $now       = mysqli_real_escape_string($conn, $now);
    mysqli_query($conn, "INSERT INTO `query_history` (`order_id`, `changed_by`, `action`, `field_changed`, `old_value`, `new_value`, `timestamp_pkt`)
        VALUES ($id, '$changedBy', '$action', '$field', " . ($oldVal === '' ? 'NULL' : "'$oldVal'") . ", '$newVal', '$now')");
}

if ($action === 'complete') {
    $manualDate = isset($body['manual_date']) ? mysqli_real_escape_string($conn, $body['manual_date']) : '';
    $doneTime   = !empty($manualDate) ? $manualDate : $now;
    $manualSql  = !empty($manualDate) ? ", `query_manual_done` = '$manualDate'" : '';
    $sql = "UPDATE `order` SET
        `query_done` = '$doneTime',
        `completed_by` = '$user',
        `instruction` = '$instruction',
        `status` = 'completed'
        $manualSql
        WHERE `id` = '$id'";
    if (mysqli_query($conn, $sql)) {
        logActivity('Mark Completed', "Order #$id marked completed by $user");
        if ($current['status'] !== 'completed')
            logHistory($conn, $id, $user, 'Status Change', 'status', $current['status'], 'completed', $now);
        if ($current['completed_by'] !== $user)
            logHistory($conn, $id, $user, 'Assigned To', 'completed_by', $current['completed_by'], $user, $now);
        if ($instruction && $current['instruction'] !== $instruction)
            logHistory($conn, $id, $user, 'Note Added', 'instruction', $current['instruction'], $instruction, $now);
        echo json_encode(['status' => 'success', 'message' => 'Query marked as completed']);
    } else {
        echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    }
}
elseif ($action === 'issue') {
    if ($current['status'] === 'issue' && !isSuperAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Already marked as issue']); exit();
    }
    $sql = "UPDATE `order` SET `instruction` = '$instruction', `status` = 'issue' WHERE `id` = '$id'";
    if (mysqli_query($conn, $sql)) {
        logActivity('Mark Issue', "Order #$id marked as issue");
        logHistory($conn, $id, $user ?: 'CSR', 'Status Change', 'status', $current['status'], 'issue', $now);
        if ($instruction && $current['instruction'] !== $instruction)
            logHistory($conn, $id, $user ?: 'CSR', 'Note Added', 'instruction', $current['instruction'], $instruction, $now);
        echo json_encode(['status' => 'success', 'message' => 'Query marked as issue']);
    } else {
        echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    }
}
elseif ($action === 'resolve') {
    if ($current['status'] !== 'issue' && !isSuperAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Order is not in issue status']); exit();
    }
    $resolution = isset($body['resolution']) ? mysqli_real_escape_string($conn, $body['resolution']) : '';
    $combined   = !empty($instruction) ? $instruction : '';
    if (!empty($resolution)) {
        $combined = !empty($combined) ? "$combined | Resolved: $resolution" : "Resolved: $resolution";
    }
    $sql = "UPDATE `order` SET
        `query_done` = '$now',
        `completed_by` = '$user',
        `instruction` = '$combined',
        `status` = 'completed'
        WHERE `id` = '$id'";
    if (mysqli_query($conn, $sql)) {
        logActivity('Resolve Issue', "Order #$id issue resolved by $user");
        logHistory($conn, $id, $user, 'Issue Resolved', 'status', 'issue', 'completed', $now);
        if ($user && $current['completed_by'] !== $user)
            logHistory($conn, $id, $user, 'Assigned To', 'completed_by', $current['completed_by'], $user, $now);
        if ($resolution)
            logHistory($conn, $id, $user, 'Resolution Note', 'instruction', $current['instruction'], $combined, $now);
        echo json_encode(['status' => 'success', 'message' => 'Issue resolved and marked as completed']);
    } else {
        echo json_encode(['status' => 'error', 'message' => mysqli_error($conn)]);
    }
}
else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}

mysqli_close($conn);