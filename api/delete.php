<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/Database.php';

$response = ['success' => false, 'message' => ''];

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Debug log
    error_log("Delete request received. Data: " . print_r($data, true));

    // Validate input
    if (!isset($data['id']) || !is_numeric($data['id'])) {
        throw new Exception('Invalid user ID');
    }

    $userId = (int)$data['id'];

    $database = new Database();
    $db = $database->getConnection();

    // First check if the user exists
    $checkStmt = $db->prepare("SELECT id FROM users WHERE id = :id");
    $checkStmt->bindParam(':id', $userId);
    $checkStmt->execute();

    if ($checkStmt->rowCount() === 0) {
        throw new Exception('User not found');
    }

    // Perform the delete
    $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
    $stmt->bindParam(':id', $userId);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'User deleted successfully';
    } else {
        throw new Exception('Failed to delete user');
    }

} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    $response['debug'] = [
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    
    // Log the error
    error_log("Delete error: " . $e->getMessage());
}

echo json_encode($response);
?>
