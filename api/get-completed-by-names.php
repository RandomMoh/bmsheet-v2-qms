<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

header('Content-Type: application/json; charset=UTF-8');
mysqli_set_charset($conn, 'utf8mb4');

$res = mysqli_query($conn, "SELECT DISTINCT name FROM (
    SELECT completed_by AS name FROM `order` WHERE completed_by IS NOT NULL AND TRIM(completed_by) != ''
    UNION
    SELECT qname AS name FROM `order` WHERE qname IS NOT NULL AND TRIM(qname) != ''
) AS names");

if (!$res) { echo json_encode([]); exit(); }

$rawNames = [];
while ($row = mysqli_fetch_assoc($res)) {
    $name = trim($row['name']);
    if (!empty($name)) {
        $rawNames[] = $name;
    }
}

$ures = mysqli_query($conn, "SELECT dusername, dname FROM `user`");
$uByUsername = []; // dusername => dname
$uByDname = [];    // dname => dusername
if ($ures) {
    while ($row = mysqli_fetch_assoc($ures)) {
        $uByUsername[trim($row['dusername'])] = trim($row['dname']);
        $uByDname[strtolower(trim($row['dname']))] = trim($row['dusername']);
    }
}

$canonical = []; // display_name => [raw values]

foreach ($rawNames as $raw) {
    $lower = strtolower($raw);

    if (isset($uByUsername[$raw])) {
        $display = $uByUsername[$raw];
    }
    elseif (isset($uByDname[$lower])) {
        foreach ($uByUsername as $uname => $dname) {
            if (strtolower($dname) === $lower) {
                $display = $dname;
                break;
            }
        }
        if (!isset($display)) $display = $raw;
    }
    else {
        $display = $raw;
    }

    if (!isset($canonical[$display])) $canonical[$display] = [];
    if (!in_array($raw, $canonical[$display])) $canonical[$display][] = $raw;

    unset($display);
}

$final = [];
foreach ($canonical as $display => $values) {
    $final[] = ['display' => $display, 'values' => $values];
}

usort($final, function($a, $b) {
    return strcasecmp($a['display'], $b['display']);
});

echo json_encode($final);
mysqli_close($conn);
?>