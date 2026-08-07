<?php
date_default_timezone_set('Asia/Karachi');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include_once 'config.php';

$rateLimiter = checkRateLimit('login', 5, 300);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    echo json_encode(["status" => "error", "message" => "Missing credentials"]);
    exit();
}

$raw_user = trim($data->username);
$password = trim($data->password);
$input_user = mysqli_real_escape_string($conn, $raw_user);

define('MAINTENANCE_MODE', false);
$ALLOWED_USERS = ['M/2309', 'm/2309', 'M', 'm', 'Moh', 'moh'];

$is_allowed = false;
foreach ($ALLOWED_USERS as $u) {
    if (strcasecmp($raw_user, $u) === 0) {
        $is_allowed = true;
        break;
    }
}

if (MAINTENANCE_MODE && !$is_allowed) {
    echo json_encode(["status" => "error", "message" => "Portal is under scheduled maintenance. Please try again later."]);
    exit();
}

function checkPassword($input, $stored, $plainStored = null)
{
    if (!empty($stored) && password_verify($input, $stored)) {
        return true;
    }
    if ($input === $stored) {
        return true;
    }
    if (!empty($plainStored) && $input === $plainStored) {
        return true;
    }
    return false;
}

$q = mysqli_query($conn, "SELECT d_id, dusername, dname, dpassword, plain_password, project_filter, role FROM user WHERE LOWER(TRIM(dusername)) = LOWER('$input_user') OR dusername = '$input_user'");
if (!$q) {
    echo json_encode(["status" => "error", "message" => "DB Error: " . mysqli_error($conn)]);
    exit();
}

if (mysqli_num_rows($q) > 0) {
    $row = mysqli_fetch_assoc($q);
    if (checkPassword($password, $row['dpassword'], $row['plain_password'])) {
        session_regenerate_id(true);
        $rateLimiter['clear_attempts']();

        $userRole = !empty($row['role']) ? $row['role'] : 'CSR';
        $_SESSION['auth'] = true;
        $_SESSION['role'] = $userRole;
        $_SESSION['user_id'] = $row['d_id'];
        $_SESSION['username'] = $row['dname'];
        
        $userId = (int)$row['d_id'];
        $dusername = $row['dusername'];
        $sessId = session_id() ?: ('sess_' . $userId);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $now = date('Y-m-d H:i:s');

        // Immediately update active_sessions on login with official role from user table
        $stmt = $conn->prepare("INSERT INTO `active_sessions` (`user_id`, `username`, `role`, `session_id`, `last_active`, `login_time`, `ip_address`) 
            VALUES (?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE `last_active` = ?, `login_time` = ?, `username` = ?, `role` = ?, `session_id` = ?, `ip_address` = ?");
        if ($stmt) {
            $stmt->bind_param("issssssssssss", $userId, $dusername, $userRole, $sessId, $now, $now, $ip, $now, $now, $dusername, $userRole, $sessId, $ip);
            $stmt->execute();
            $stmt->close();
        }

        $deployVersion = '1';
        $vFile = __DIR__ . '/version.json';
        $indexPath = __DIR__ . '/../index.html';
        if (file_exists($vFile)) {
            clearstatcache(true, $vFile);
            $vData = json_decode(file_get_contents($vFile), true);
            if (!empty($vData['version'])) {
                $deployVersion = (string)$vData['version'];
            }
        } else if (file_exists($indexPath)) {
            clearstatcache(true, $indexPath);
            $deployVersion = (string)filemtime($indexPath);
        }

        logActivity('Login', $userRole . ' logged in: ' . $row['dname']);
        echo json_encode([
            "status" => "success",
            "role" => "user",
            "deploy_version" => $deployVersion,
            "user" => [
                "id" => $row['d_id'],
                "username" => $row['dusername'],
                "name" => $row['dname'],
                "project_filter" => $row['project_filter'],
                "userRole" => $userRole
            ]
        ]);
        exit();
    }
}

$rateLimiter['record_attempt']();
echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
?>