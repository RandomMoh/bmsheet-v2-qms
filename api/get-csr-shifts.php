<?php
date_default_timezone_set('Asia/Karachi');
include_once 'config.php';

// Simplified shift schedule listing only names per shift
$schedule = [
    'shift1' => [
        'label' => '7am till 4pm',
        'csrs' => [
            ['name' => 'Laiba Azeem', 'username' => 'laiba.azeem'],
            ['name' => 'Rafia', 'username' => 'rafia'],
            ['name' => 'Amna Zaheer', 'username' => 'amna.zaheer'],
            ['name' => 'Alishba CSR', 'username' => 'alishba'],
            ['name' => 'Khadija CSR', 'username' => 'khadija'],
            ['name' => 'Romaisa', 'username' => 'romaisa'],
            ['name' => 'Ahmed Hanif', 'username' => 'ahmed.hanif']
        ]
    ],
    'shift2' => [
        'label' => '12pm till 9pm',
        'csrs' => [
            ['name' => 'Hafsa CSR', 'username' => 'hafsa'],
            ['name' => 'Saman CSR', 'username' => 'saman'],
            ['name' => 'Aman Zahra CSR', 'username' => 'aman_zahra'],
            ['name' => 'Kaneez Fatima', 'username' => 'kaneez.fatima'],
            ['name' => 'Bisma', 'username' => 'bisma'],
            ['name' => 'Mehak Ashik', 'username' => 'mehak.ashik'],
            ['name' => 'Iqra Ibrahim', 'username' => 'iqra.ibrahim']
        ]
    ],
    'shift3' => [
        'label' => '10pm till 7am',
        'csrs' => [
            ['name' => 'Fatima Zahra CSR', 'username' => 'fatima.zahra'],
            ['name' => 'Shiza CSR', 'username' => 'shiza'],
            ['name' => 'Muteeba CSR', 'username' => 'muteeba']
        ]
    ]
];

// Fetch active sessions from active_sessions table
$active_res = mysqli_query($conn, "SELECT user_id, username, last_active FROM active_sessions WHERE last_active >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)");
$active_users = [];
if ($active_res) {
    while ($r = mysqli_fetch_assoc($active_res)) {
        $active_users[strtolower($r['username'])] = $r['last_active'];
    }
}

// Fetch recent order activity as secondary online indicator (within last 15 minutes)
$recent_order_res = mysqli_query($conn, "SELECT DISTINCT qname, completed_by FROM `order` WHERE date >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)");
if ($recent_order_res) {
    while ($r = mysqli_fetch_assoc($recent_order_res)) {
        if (!empty($r['qname'])) $active_users[strtolower($r['qname'])] = date('Y-m-d H:i:s');
        if (!empty($r['completed_by'])) $active_users[strtolower($r['completed_by'])] = date('Y-m-d H:i:s');
    }
}

// Current PKT hour to determine active shift
$currentHour = intval(date('H'));
$currentMinute = intval(date('i'));
$currentTimeVal = $currentHour * 100 + $currentMinute;

$isShift1Active = ($currentTimeVal >= 700 && $currentTimeVal < 1600);
$isShift2Active = ($currentTimeVal >= 1200 && $currentTimeVal < 2100);
$isShift3Active = ($currentTimeVal >= 2200 || $currentTimeVal < 700);

$shiftInfo = [
    'shift1' => ['label' => '7am till 4pm', 'active' => $isShift1Active],
    'shift2' => ['label' => '12pm till 9pm', 'active' => $isShift2Active],
    'shift3' => ['label' => '10pm till 7am', 'active' => $isShift3Active]
];

$decoratedSchedule = [];
$stats = [
    'total_csrs' => 0,
    'scheduled_now' => 0,
    'online_in_shift' => 0,
    'offline_in_shift' => 0,
    'online_total' => count($active_users)
];

foreach (['shift1', 'shift2', 'shift3'] as $sKey) {
    $shift = $schedule[$sKey];
    $isActive = $shiftInfo[$sKey]['active'];
    $decoratedCsrs = [];

    foreach ($shift['csrs'] as $csr) {
        $stats['total_csrs']++;
        $uname = strtolower($csr['username']);
        $dname = strtolower($csr['name']);
        
        $isOnline = isset($active_users[$uname]) || isset($active_users[$dname]);
        $lastActiveTime = $active_users[$uname] ?? $active_users[$dname] ?? null;

        if ($isActive) {
            $stats['scheduled_now']++;
            if ($isOnline) {
                $stats['online_in_shift']++;
                $statusState = 'online_in_shift';
            } else {
                $stats['offline_in_shift']++;
                $statusState = 'offline_in_shift';
            }
        } else {
            if ($isOnline) {
                $statusState = 'online_off_duty';
            } else {
                $statusState = 'offline';
            }
        }

        $decoratedCsrs[] = [
            'name' => $csr['name'],
            'username' => $csr['username'],
            'isOnline' => $isOnline,
            'statusState' => $statusState,
            'lastActive' => $lastActiveTime,
            'inCurrentShift' => $isActive
        ];
    }

    $decoratedSchedule[$sKey] = [
        'label' => $shiftInfo[$sKey]['label'],
        'isActive' => $isActive,
        'csrs' => $decoratedCsrs
    ];
}

echo json_encode([
    'status' => 'success',
    'pkt_time' => date('Y-m-d H:i:s'),
    'shift_info' => $shiftInfo,
    'stats' => $stats,
    'schedule' => $decoratedSchedule
]);
?>
