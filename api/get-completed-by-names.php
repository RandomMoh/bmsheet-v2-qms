<?php
date_default_timezone_set('Asia/Karachi');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

header('Content-Type: application/json; charset=UTF-8');
mysqli_set_charset($conn, 'utf8mb4');

// Get all distinct completed_by values from orders
$res = mysqli_query($conn, "SELECT DISTINCT completed_by FROM `order` WHERE completed_by IS NOT NULL AND TRIM(completed_by) != ''");
if (!$res) { echo json_encode([]); exit(); }

$rawNames = [];
while ($row = mysqli_fetch_assoc($res)) {
    $rawNames[] = trim($row['completed_by']);
}

// Get user table: dusername -> dname
$ures = mysqli_query($conn, "SELECT dusername, dname FROM `user`");
$uByUsername = []; // dusername => dname
$uByDname = [];    // dname => dusername
if ($ures) {
    while ($row = mysqli_fetch_assoc($ures)) {
        $uByUsername[trim($row['dusername'])] = trim($row['dname']);
        $uByDname[strtolower(trim($row['dname']))] = trim($row['dusername']);
    }
}

// Map every raw completed_by value to a canonical display name
// Strategy: if the raw value IS a dname, use it; if it IS a dusername, return its dname; else use as-is
$canonical = []; // display_name => [raw values]

foreach ($rawNames as $raw) {
    $lower = strtolower($raw);

    // Case 1: raw matches a dusername exactly → map to dname
    if (isset($uByUsername[$raw])) {
        $display = $uByUsername[$raw];
    }
    // Case 2: raw matches a dname exactly (case-insensitive) → use dname
    elseif (isset($uByDname[$lower])) {
        // find the canonical casing from user table
        foreach ($uByUsername as $uname => $dname) {
            if (strtolower($dname) === $lower) {
                $display = $dname;
                break;
            }
        }
        if (!isset($display)) $display = $raw;
    }
    // Case 3: no match → use raw value as-is
    else {
        $display = $raw;
    }

    if (!isset($canonical[$display])) $canonical[$display] = [];
    if (!in_array($raw, $canonical[$display])) $canonical[$display][] = $raw;

    unset($display);
}

// Build output array
$final = [];
foreach ($canonical as $display => $values) {
    $final[] = ['display' => $display, 'values' => $values];
}

usort($final, function($a, $b) {
    return strcasecmp($a['display'], $b['display']);
});

echo json_encode($final);
mysqli_close($conn);