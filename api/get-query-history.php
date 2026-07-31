<?php
error_reporting(0);
ini_set('display_errors', '0');
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit(); }

header('Content-Type: application/json; charset=UTF-8');
mysqli_set_charset($conn, 'utf8mb4');

$order_id = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
if (!$order_id) { echo json_encode(['status' => 'error', 'message' => 'Missing order_id']); exit(); }

// 1. Fetch main order row
$orderRes = mysqli_query($conn, "SELECT * FROM `order` WHERE `id` = $order_id LIMIT 1");
$orderData = $orderRes ? mysqli_fetch_assoc($orderRes) : null;

// 2. Fetch explicit history rows
$res = mysqli_query($conn, "SELECT * FROM `query_history` WHERE `order_id` = $order_id ORDER BY `timestamp_pkt` ASC");
$rows = [];
if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        $rows[] = $row;
    }
}

// 3. Synthesize milestone events if not already present
if ($orderData) {
    $hasCreated = false;
    $hasFirstReply = false;
    $hasCompleted = false;

    foreach ($rows as $r) {
        $act = strtolower($r['action'] ?? '');
        if (strpos($act, 'created') !== false) $hasCreated = true;
        if (strpos($act, 'reply') !== false) $hasFirstReply = true;
        if (strpos($act, 'comp') !== false || strpos($act, 'resolv') !== false) $hasCompleted = true;
    }

    // Add Created milestone if not present
    $recvTime = $orderData['query-received_datetime'] ?? $orderData['inserted_datetime'] ?? null;
    if (!$hasCreated && $recvTime) {
        $creator = !empty($orderData['qname']) ? $orderData['qname'] : ($orderData['communication_medium'] ?? 'System');
        $rows[] = [
            'id' => 'synth_created_' . $order_id,
            'order_id' => $order_id,
            'changed_by' => $creator,
            'action' => 'Query Created',
            'field_changed' => 'status',
            'old_value' => null,
            'new_value' => 'pending',
            'timestamp_pkt' => $recvTime,
            'is_synthetic' => true
        ];
    }

    // Add First Reply milestone if set and missing
    $firstReplyTime = $orderData['query-first-reply_datetime'] ?? null;
    if (!$hasFirstReply && !empty($firstReplyTime) && $firstReplyTime !== '0000-00-00 00:00:00') {
        $rows[] = [
            'id' => 'synth_reply_' . $order_id,
            'order_id' => $order_id,
            'changed_by' => $orderData['qname'] ?? 'Slack Bot / CSR',
            'action' => 'First Reply Sent',
            'field_changed' => 'query-first-reply_datetime',
            'old_value' => null,
            'new_value' => $firstReplyTime,
            'timestamp_pkt' => $firstReplyTime,
            'is_synthetic' => true
        ];
    }

    // Add Completed milestone if set and missing
    $doneTime = $orderData['query_done'] ?? $orderData['query_manual_done'] ?? null;
    if (!$hasCompleted && !empty($doneTime) && $doneTime !== '0000-00-00 00:00:00' && strtolower($orderData['status'] ?? '') === 'completed') {
        $completer = !empty($orderData['completed_by']) ? $orderData['completed_by'] : 'CSR';
        $rows[] = [
            'id' => 'synth_done_' . $order_id,
            'order_id' => $order_id,
            'changed_by' => $completer,
            'action' => 'Query Completed',
            'field_changed' => 'status',
            'old_value' => 'pending',
            'new_value' => 'completed',
            'timestamp_pkt' => $doneTime,
            'is_synthetic' => true
        ];
    }
}

// Sort all events by timestamp_pkt
usort($rows, function($a, $b) {
    return strtotime($a['timestamp_pkt']) <=> strtotime($b['timestamp_pkt']);
});

echo json_encode([
    'status' => 'success',
    'order' => $orderData,
    'data' => $rows
]);
mysqli_close($conn);
