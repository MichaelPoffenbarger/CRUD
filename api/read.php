<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/Database.php';

$response = ['success' => false, 'message' => '', 'data' => []];

try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT id, first_name, last_name, email, phone, created_at 
              FROM users 
              ORDER BY created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($users) {
        $response['success'] = true;
        $response['data'] = $users;
        $response['message'] = 'Users retrieved successfully';
    } else {
        $response['message'] = 'No users found';
    }

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    $response['debug'] = [
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    
    error_log("Error loading users: " . $e->getMessage());
}

echo json_encode($response);
?>
