<?php
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_lifetime', 28800);   // 8 hours
ini_set('session.gc_maxlifetime', 28800);     // Keep session data for 8h
ini_set('session.cookie_samesite', 'None');   // Allow cross-origin (HTTPS API URL)
ini_set('session.cookie_secure', 1);          // Required for SameSite=None

$session_path = __DIR__ . '/sessions';
if (!is_dir($session_path)) {
    mkdir($session_path, 0777, true);
}
ini_set('session.save_path', $session_path);
ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);

session_name('qms_sess_v3');
session_start();

date_default_timezone_set('Asia/Karachi');
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-QMS-User, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Hardened Security Headers
header("X-Frame-Options: SAMEORIGIN");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$db_user = "bmsheetv2benchma_admin";
$db_pass = "}B(cMH)z[*g@";
$db_name = "bmsheetv2benchma_qms";

$conn = mysqli_connect($host, $db_user, $db_pass, $db_name);

if (!$conn) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

$script_name = basename($_SERVER['SCRIPT_NAME']);
$exempt_scripts = [
    'login.php', 
    'slack-webhook.php', 
    'upgrade.php',
    'dev-login.php',
    'dev-login-maker.php',
    'dev-change-password.php',
    'dev-channels.php',
    'dev-workspaces.php',
    'dev-logs.php',
    'dev-telemetry.php',
    'dev-webhook-status.php',
    'get-slack-thread.php',
    'setup_slack_channels.php',
    'create-csr.php',
    'get-activity-logs.php',
    'get-csr-shifts.php',
    'heartbeat.php',
    'leave.php'
];

// Read header-based token authentication for multi-tab & persistent session safety
$headers = function_exists('getallheaders') ? getallheaders() : [];
$qmsUserHeader = $headers['X-QMS-User'] ?? $headers['x-qms-user'] ?? $_SERVER['HTTP_X_QMS_USER'] ?? null;

if (!empty($qmsUserHeader)) {
    $uData = json_decode($qmsUserHeader, true);
    if ($uData && !empty($uData['id'])) {
        $uId = (int)$uData['id'];
        $uCheck = mysqli_query($conn, "SELECT d_id, dusername, dname, role FROM user WHERE d_id = $uId LIMIT 1");
        if ($uCheck && $uRow = mysqli_fetch_assoc($uCheck)) {
            $_SESSION['auth'] = true;
            $_SESSION['user_id'] = (int)$uRow['d_id'];
            $_SESSION['username'] = $uRow['dname'];
            $_SESSION['role'] = $uRow['role'] ?? 'CSR';
        }
    }
}

if (!in_array($script_name, $exempt_scripts)) {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
    if (!isset($_SESSION['auth']) || $_SESSION['auth'] !== true) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized Access. Please log in."]);
        exit();
    }
    session_write_close();
}

function isAdmin() {
    return isset($_SESSION['role']) && strtolower($_SESSION['role']) === 'admin';
}

function isSuperAdmin() {
    if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
        $username = isset($_SESSION['username']) ? $_SESSION['username'] : '';
        return ($username === 'Moh' || $username === 'sajid csr admin login');
    }
    return false;
}

function logActivity($action, $details) {
    global $conn;
    $user_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
    $role = isset($_SESSION['role']) ? mysqli_real_escape_string($conn, $_SESSION['role']) : 'system';
    $username = isset($_SESSION['username']) ? mysqli_real_escape_string($conn, $_SESSION['username']) : 'System';
    $action = mysqli_real_escape_string($conn, $action);
    $details = mysqli_real_escape_string($conn, $details);
    $time = date('Y-m-d H:i:s');
    mysqli_query($conn, "INSERT INTO activity_logs (user_id, role, username, action, details, timestamp_pkt) VALUES ($user_id, '$role', '$username', '$action', '$details', '$time')");
}

define('GEMINI_API_KEY', 'AQ.Ab8RN6LsnzOeSddgv1jmpWiZ_u8jdWXbPMp0PR5xn3e4CaQSsQ');
define('SLACK_BOT_TOKEN', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH');
define('SLACK_TOKEN_SHIFT1', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH');
define('SLACK_TOKEN_SHIFT2', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH');
define('SLACK_TOKEN_SHIFT3', 'xoxb-2056924731457-10727441782816-ONexPALq6C1CYO6LPiAnsIiH');

/**
 * IP-based Rate Limiter (locks after $maxAttempts failed attempts within $decaySeconds)
 */
function checkRateLimit($key = 'login', $maxAttempts = 5, $decaySeconds = 300) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ips[0]);
    }
    
    $hash = md5($key . '_' . $ip);
    $dir = __DIR__ . '/sessions/rate_limit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    $file = $dir . '/' . $hash . '.json';
    $now = time();
    
    $data = ['attempts' => 0, 'first_attempt' => $now, 'locked_until' => 0];
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        if ($content) {
            $parsed = json_decode($content, true);
            if (is_array($parsed)) {
                $data = array_merge($data, $parsed);
            }
        }
    }

    if ($now - $data['first_attempt'] > $decaySeconds) {
        $data['attempts'] = 0;
        $data['first_attempt'] = $now;
        $data['locked_until'] = 0;
    }

    if ($data['locked_until'] > $now) {
        $remaining = $data['locked_until'] - $now;
        http_response_code(429);
        echo json_encode([
            "status" => "error",
            "message" => "Too many failed attempts. Account locked for security. Please try again in " . ceil($remaining / 60) . " minute(s)."
        ]);
        exit();
    }

    return [
        'record_attempt' => function() use ($file, &$data, $now, $maxAttempts, $decaySeconds) {
            $data['attempts']++;
            if ($data['attempts'] >= $maxAttempts) {
                $data['locked_until'] = $now + $decaySeconds;
            }
            @file_put_contents($file, json_encode($data), LOCK_EX);
        },
        'clear_attempts' => function() use ($file) {
            if (file_exists($file)) {
                @unlink($file);
            }
        }
    ];
}
?>