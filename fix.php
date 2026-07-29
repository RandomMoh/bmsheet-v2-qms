<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['SCRIPT_NAME'] = 'fix.php';
require_once __DIR__ . '/api/config.php';
$res = mysqli_query($conn, "SELECT * FROM orders WHERE project_name LIKE '%Focal%' OR department LIKE '%Focal%'");
if($res){
    while($row = mysqli_fetch_assoc($res)){
        print_r($row);
    }
} else {
    echo mysqli_error($conn);
}
