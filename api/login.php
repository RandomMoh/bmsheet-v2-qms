<?php
date_default_timezone_set('Asia/Karachi');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    echo json_encode(["status" => "error", "message" => "Missing credentials"]);
    exit();
}

$input_user = mysqli_real_escape_string($conn, $data->username);
$password = $data->password;

define('MAINTENANCE_MODE', false);
$ALLOWED_USERS = ['M/2309', 'm/2309', 'M', 'm', 'Moh', 'moh'];

$req_user = trim($data->username);
$is_allowed = false;
foreach ($ALLOWED_USERS as $u) {
    if (strcasecmp($req_user, $u) === 0) {
        $is_allowed = true;
        break;
    }
}

if (MAINTENANCE_MODE && !$is_allowed) {
    echo json_encode(["status" => "error", "message" => "Portal is under scheduled maintenance. Please try again later."]);
    exit();
}

function checkPassword($input, $stored)
{
    if (password_verify($input, $stored))
        return true;
    return ($input === $stored);
}

$q = mysqli_query($conn, "SELECT d_id, dusername, dname, dpassword, project_filter, role FROM user WHERE dusername = '$input_user'");
if (!$q) {
    echo json_encode(["status" => "error", "message" => "DB Error: " . mysqli_error($conn)]);
    exit();
}
if (mysqli_num_rows($q) > 0) {
    $row = mysqli_fetch_assoc($q);
    if (checkPassword($password, $row['dpassword'])) {
        $_SESSION['auth'] = true;
        $_SESSION['role'] = 'user';
        $_SESSION['user_id'] = $row['d_id'];
        $_SESSION['username'] = $row['dname'];
        logActivity('Login', ($row['role'] ?? 'CSR') . ' logged in: ' . $row['dname']);
        echo json_encode([
            "status" => "success",
            "role" => "user",
            "user" => [
                "id" => $row['d_id'],
                "username" => $row['dusername'],
                "name" => $row['dname'],
                "project_filter" => $row['project_filter'],
                "userRole" => $row['role'] ?? 'CSR'
            ]
        ]);
        exit();
    }
}

echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
?>