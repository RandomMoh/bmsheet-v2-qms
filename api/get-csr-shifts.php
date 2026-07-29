<?php
date_default_timezone_set('Asia/Karachi');
include_once 'config.php';

function formatUptime($secs) {
    if ($secs < 60) return "< 1m";
    $mins = floor($secs / 60);
    $hours = floor($mins / 60);
    $days = floor($hours / 24);
    
    if ($days > 0) {
        return "{$days}d " . ($hours % 24) . "h";
    } elseif ($hours > 0) {
        return "{$hours}h " . ($mins % 60) . "m";
    } else {
        return "{$mins}m";
    }
}

// Shift schedule listing names per shift
$schedule = [
    'shift1' => [
        'label' => '7am till 4pm',
        'csrs' => [
            ['name' => 'Laiba Azeem', 'username' => 'laiba.azeem'],
            ['name' => 'Rafia', 'username' => 'rafia'],
            ['name' => 'Amna Zaheer', 'username' => 'amna.zaheer'],
            ['name' => 'Alishba CSR', 'username' => 'alishba'],
            ['name' => 'Khadija CSR', 'username' => 'khadija'],
            ['name' => 'Romaisa', 'username' => 'romaisa']
        ]
    ],
    'shift2' => [
        'label' => '12pm till 9pm',
        'csrs' => [
            ['name' => 'Ahmed Hanif', 'username' => 'ahmed.hanif'],
            ['name' => 'Hafsa CSR', 'username' => 'hafsa'],
            ['name' => 'Ayesha Waris', 'username' => 'ayesha_waris'],
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
            ['name' => 'Muteeba CSR', 'username' => 'muteeba'],
            ['name' => 'Ayesha Owais', 'username' => 'ayesha.owais']
        ]
    ]
];

// Fetch active sessions from active_sessions table
$active_res = mysqli_query($conn, "SELECT a.user_id, a.username, a.role, a.last_active, a.login_time, u.dname, u.dusername 
    FROM active_sessions a 
    LEFT JOIN user u ON (u.d_id = a.user_id OR LOWER(u.dusername) = LOWER(a.username) OR LOWER(u.dname) = LOWER(a.username))
    ORDER BY a.last_active DESC");

$active_users = [];
$active_users_list = [];
$seen_users = [];
$nowTime = time(); // Current PKT epoch timestamp

if ($active_res) {
    while ($r = mysqli_fetch_assoc($active_res)) {
        $lastAct = $r['last_active'];
        $lastActTime = strtotime($lastAct);
        
        // Only count session as active if last_active ping was within last 2 minutes (120s)
        if (($nowTime - $lastActTime) > 120 || $lastActTime > ($nowTime + 300)) {
            continue;
        }

        $loginTime = !empty($r['login_time']) ? $r['login_time'] : $lastAct;
        $uptimeSecs = max(0, $nowTime - strtotime($loginTime));
        $uptimeStr = formatUptime($uptimeSecs);

        $userData = [
            'lastActive' => $lastAct,
            'loginTime' => $loginTime,
            'uptime' => $uptimeStr,
            'uptimeSecs' => $uptimeSecs
        ];

        if (!empty($r['username'])) $active_users[strtolower($r['username'])] = $userData;
        if (!empty($r['dusername'])) $active_users[strtolower($r['dusername'])] = $userData;
        if (!empty($r['dname'])) $active_users[strtolower($r['dname'])] = $userData;
        if (!empty($r['user_id'])) $active_users['id_' . $r['user_id']] = $userData;
        
        $uKey = strtolower($r['dusername'] ?: $r['username']);
        if (!isset($seen_users[$uKey])) {
            $seen_users[$uKey] = true;
            $active_users_list[] = [
                'user_id' => $r['user_id'],
                'username' => $r['dusername'] ?: $r['username'],
                'displayName' => $r['dname'] ?: $r['username'],
                'role' => $r['role'] ?: 'User',
                'lastActive' => $r['last_active'],
                'loginTime' => $loginTime,
                'uptime' => $uptimeStr,
                'uptimeSecs' => $uptimeSecs
            ];
        }
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
    'online_total' => count($active_users_list)
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
        $userInfo = $active_users[$uname] ?? $active_users[$dname] ?? null;
        $lastActiveTime = $userInfo['lastActive'] ?? null;
        $uptimeStr = $userInfo['uptime'] ?? null;
        $uptimeSecs = $userInfo['uptimeSecs'] ?? 0;

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
            'uptime' => $uptimeStr,
            'uptimeSecs' => $uptimeSecs,
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
    'schedule' => $decoratedSchedule,
    'active_users_list' => $active_users_list
]);
?>
