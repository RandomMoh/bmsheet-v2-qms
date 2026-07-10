<?php
include 'config.php';

$sql = "CREATE TABLE IF NOT EXISTS `slack_channels` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `channel_id` VARCHAR(255) NOT NULL UNIQUE,
    `channel_name` VARCHAR(255) NOT NULL,
    `default_project` VARCHAR(255) DEFAULT '',
    `default_department` VARCHAR(255) DEFAULT '',
    `hint` TEXT,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if (mysqli_query($conn, $sql)) {
    echo "Table slack_channels created successfully.\n";
} else {
    echo "Error creating table: " . mysqli_error($conn) . "\n";
}

$initialData = [
    [
        'C02203MEEBS', 
        'bm-xactimate-trueplan-operations', 
        'Xactimate', 
        'Floor Plan', 
        'This channel is for Xactimate/TruePlan floor plan orders. Default project is Xactimate.'
    ],
    [
        'C0ALZCHAE1G', 
        'bm-internal-dev-testing', 
        '', 
        '', 
        ''
    ]
];

foreach ($initialData as $data) {
    $channel_id = mysqli_real_escape_string($conn, $data[0]);
    $channel_name = mysqli_real_escape_string($conn, $data[1]);
    $default_project = mysqli_real_escape_string($conn, $data[2]);
    $default_department = mysqli_real_escape_string($conn, $data[3]);
    $hint = mysqli_real_escape_string($conn, $data[4]);

    $insert = "INSERT IGNORE INTO `slack_channels` (channel_id, channel_name, default_project, default_department, hint) 
               VALUES ('$channel_id', '$channel_name', '$default_project', '$default_department', '$hint')";
    
    if (mysqli_query($conn, $insert)) {
        echo "Inserted/Verified $channel_id ($channel_name)\n";
    } else {
        echo "Error inserting $channel_id: " . mysqli_error($conn) . "\n";
    }
}
?>
