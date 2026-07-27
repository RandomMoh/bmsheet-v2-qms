<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if (!isset($_SESSION['username']) || $_SESSION['username'] !== 'Moh') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Access denied']);
    exit();
}

$type = isset($_GET['type']) ? $_GET['type'] : 'all';

$response = [];

$sessions = mysqli_query($conn, "SELECT username, role, last_active, login_time, ip_address FROM `active_sessions` ORDER BY last_active DESC");
$active = [];
while ($row = mysqli_fetch_assoc($sessions)) {
    $loginTime = new DateTime($row['login_time']);
    $now = new DateTime();
    $diff = $now->diff($loginTime);
    $duration = '';
    if ($diff->h > 0 || $diff->days > 0) {
        $totalH = $diff->h + ($diff->days * 24);
        $duration = $totalH . 'h ' . $diff->i . 'm';
    } else {
        $duration = $diff->i . 'm ' . $diff->s . 's';
    }

    $active[] = [
        'username' => $row['username'],
        'role' => $row['role'],
        'last_active' => $row['last_active'],
        'login_time' => $row['login_time'],
        'duration' => $duration,
        'ip' => $row['ip_address']
    ];
}
$response['active_sessions'] = $active;

$limit = ($type === 'all') ? 100 : 50;
$filter = '';
if ($type === 'admin') $filter = "WHERE role = 'admin'";
if ($type === 'csr') $filter = "WHERE role = 'user'";
if ($type === 'security') $filter = "WHERE action IN ('LOGIN', 'CSR_CREATED', 'CSR_UPDATED', 'CSR_DELETED', 'LOGOUT')";

$logs = mysqli_query($conn, "SELECT username, role, action, details, ip_address, created_at FROM `activity_log` $filter ORDER BY created_at DESC LIMIT $limit");
$logEntries = [];
while ($row = mysqli_fetch_assoc($logs)) {
    $logEntries[] = $row;
}
$response['activity_log'] = $logEntries;

echo json_encode($response);
?>
