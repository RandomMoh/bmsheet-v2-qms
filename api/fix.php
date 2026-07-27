<?php
$_SERVER['SCRIPT_NAME'] = '/dev-logs.php';
require_once 'config.php';
$res = mysqli_query($conn, "SELECT qname, communication_medium FROM `order` WHERE communication_medium = 'Slack' LIMIT 10");
$data = [];
while ($row = mysqli_fetch_assoc($res)) { $data[] = $row; }
echo json_encode(["status" => "success", "data" => $data]);
?>
