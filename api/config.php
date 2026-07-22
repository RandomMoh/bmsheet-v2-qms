<?php
// Session persists for 8 hours — survives page reloads, only dies on browser close or logout
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_lifetime', 28800);   // 8 hours
ini_set('session.gc_maxlifetime', 28800);     // Keep session data for 8h
ini_set('session.cookie_samesite', 'None');   // Allow cross-origin (HTTPS API URL)
ini_set('session.cookie_secure', 1);          // Required for SameSite=None

// Isolate sessions from other cPanel apps to prevent aggressive GC deletion
$session_path = __DIR__ . '/sessions';
if (!is_dir($session_path)) {
    mkdir($session_path, 0777, true);
}
ini_set('session.save_path', $session_path);
ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);

session_start();

date_default_timezone_set('Asia/Karachi');
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

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

// Global Authentication Shield
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
    'create-csr.php'
];

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
?>