<?php
include 'config.php';

if (!isset($_SESSION['dev_auth']) || $_SESSION['dev_auth'] !== true) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$logFile = __DIR__ . '/debug_webhook.log';
$lines   = isset($_GET['lines']) ? max(1, min(200, (int)$_GET['lines'])) : 80;

if (!file_exists($logFile)) {
    echo json_encode(["logs" => ["[SYSTEM] No log file found. Awaiting first webhook trigger..."], "last_modified" => null]);
    exit;
}

// Efficiently read last N lines without loading the whole file
$file = new SplFileObject($logFile, 'r');
$file->seek(PHP_INT_MAX);
$totalLines = $file->key();

$start = max(0, $totalLines - $lines);
$file->seek($start);

$output = [];
while (!$file->eof()) {
    $line = trim($file->current());
    if ($line !== '') {
        $output[] = $line;
    }
    $file->next();
}

echo json_encode([
    "logs"          => $output,
    "last_modified" => date('Y-m-d H:i:s', filemtime($logFile)),
    "total_lines"   => $totalLines
]);
?>
