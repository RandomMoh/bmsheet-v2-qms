<?php
date_default_timezone_set('Asia/Karachi');
include_once 'config.php';

// Define shift schedule matrix matching the schedule document
$schedule = [
    [
        'country' => 'Australia',
        'shifts' => [
            'shift1' => [
                ['name' => 'Laiba Azeem', 'username' => 'laiba.azeem'],
                ['name' => 'Rafia', 'username' => 'rafia']
            ],
            'shift2' => [
                ['name' => 'Hafsa CSR', 'username' => 'hafsa']
            ],
            'shift3' => [
                ['name' => 'Fatima Zahra CSR', 'username' => 'fatima.zahra']
            ]
        ]
    ],
    [
        'country' => 'EU',
        'shifts' => [
            'shift1' => [
                ['name' => 'Amna Zaheer', 'username' => 'amna.zaheer']
            ],
            'shift2' => [
                ['name' => 'Saman CSR', 'username' => 'saman']
            ],
            'shift3' => [
                ['name' => 'Shiza CSR', 'username' => 'shiza', 'note' => 'Shiza Awan']
            ]
        ]
    ],
    [
        'country' => 'Canada / Others',
        'shifts' => [
            'shift1' => [
                ['name' => 'Alishba CSR', 'username' => 'alishba']
            ],
            'shift2' => [
                ['name' => 'Aman Zahra CSR', 'username' => 'aman_zahra']
            ],
            'shift3' => [
                ['name' => 'Muteeba CSR', 'username' => 'muteeba', 'note' => 'WFH']
            ]
        ]
    ],
    [
        'country' => 'UK',
        'shifts' => [
            'shift1' => [
                ['name' => 'Khadija CSR', 'username' => 'khadija', 'note' => 'WFH'],
                ['name' => 'Romaisa', 'username' => 'romaisa']
            ],
            'shift2' => [
                ['name' => 'Kaneez Fatima', 'username' => 'kaneez.fatima', 'note' => 'SA'],
                ['name' => 'Bisma', 'username' => 'bisma', 'note' => 'SA'],
                ['name' => 'Mehak Ashik', 'username' => 'mehak.ashik', 'note' => 'UK All Projects'],
                ['name' => 'Iqra Ibrahim', 'username' => 'iqra.ibrahim', 'note' => 'Focal']
            ],
            'shift3' => []
        ]
    ],
    [
        'country' => 'CS OPS',
        'shifts' => [
            'shift1' => [
                ['name' => 'Ahmed Hanif', 'username' => 'ahmed.hanif']
            ],
            'shift2' => [],
            'shift3' => []
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
$currentHour = intval(date('H')); // 0 to 23
$currentMinute = intval(date('i'));
$currentTimeVal = $currentHour * 100 + $currentMinute; // e.g. 730 for 7:30

// Shift 1: 07:00 - 16:00 (700 to 1600)
// Shift 2: 12:00 - 21:00 (1200 to 2100)
// Shift 3: 22:00 - 07:00 (2200 to 2400 OR 0 to 700)

$isShift1Active = ($currentTimeVal >= 700 && $currentTimeVal < 1600);
$isShift2Active = ($currentTimeVal >= 1200 && $currentTimeVal < 2100);
$isShift3Active = ($currentTimeVal >= 2200 || $currentTimeVal < 700);

$shiftStatus = [
    'shift1' => ['label' => '7am till 4pm', 'active' => $isShift1Active],
    'shift2' => ['label' => '12pm till 9pm', 'active' => $isShift2Active],
    'shift3' => ['label' => '10pm till 7am', 'active' => $isShift3Active]
];

// Decorate schedule matrix with live status
$decoratedSchedule = [];
$stats = [
    'total_csrs' => 0,
    'scheduled_now' => 0,
    'online_in_shift' => 0,
    'offline_in_shift' => 0,
    'online_total' => 0
];

foreach ($schedule as $cat) {
    $catData = [
        'country' => $cat['country'],
        'shifts' => []
    ];

    foreach (['shift1', 'shift2', 'shift3'] as $sKey) {
        $csrs = $cat['shifts'][$sKey];
        $isCurrentShift = $shiftStatus[$sKey]['active'];
        $decoratedCsrs = [];

        foreach ($csrs as $csr) {
            $stats['total_csrs']++;
            $uname = strtolower($csr['username']);
            $dname = strtolower($csr['name']);
            
            $isOnline = isset($active_users[$uname]) || isset($active_users[$dname]);
            $lastActiveTime = $active_users[$uname] ?? $active_users[$dname] ?? null;

            if ($isOnline) {
                $stats['online_total']++;
            }

            if ($isCurrentShift) {
                $stats['scheduled_now']++;
                if ($isOnline) {
                    $stats['online_in_shift']++;
                    $statusState = 'online_in_shift'; // 🟢 Online during shift
                } else {
                    $stats['offline_in_shift']++;
                    $statusState = 'offline_in_shift'; // 🔴 Offline during shift!
                }
            } else {
                if ($isOnline) {
                    $statusState = 'online_off_duty'; // 🔵 Active outside shift
                } else {
                    $statusState = 'offline'; // ⚪ Off-duty & offline
                }
            }

            $decoratedCsrs[] = [
                'name' => $csr['name'],
                'username' => $csr['username'],
                'note' => $csr['note'] ?? '',
                'isOnline' => $isOnline,
                'statusState' => $statusState,
                'lastActive' => $lastActiveTime,
                'inCurrentShift' => $isCurrentShift
            ];
        }

        $catData['shifts'][$sKey] = [
            'label' => $shiftStatus[$sKey]['label'],
            'isActive' => $isCurrentShift,
            'csrs' => $decoratedCsrs
        ];
    }

    $decoratedSchedule[] = $catData;
}

echo json_encode([
    'status' => 'success',
    'pkt_time' => date('Y-m-d H:i:s'),
    'shift_info' => $shiftStatus,
    'stats' => $stats,
    'schedule' => $decoratedSchedule
]);
?>
