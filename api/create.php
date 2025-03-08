<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log incoming request
error_log("Received request to create.php");
error_log("POST data: " . print_r($_POST, true));

require_once '../config/Database.php';

$response = ['success' => false, 'message' => ''];

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $postData = $_POST ?: json_decode($input, true) ?: [];

    // Debug log
    error_log("Received data: " . print_r($postData, true));

    // Validate incoming data
    if (!isset($postData['firstName']) || empty($postData['firstName'])) {
        throw new Exception('First name is required');
    }
    if (!isset($postData['lastName']) || empty($postData['lastName'])) {
        throw new Exception('Last name is required');
    }
    if (!isset($postData['email']) || empty($postData['email'])) {
        throw new Exception('Email is required');
    }

    // Sanitize inputs using htmlspecialchars instead of deprecated FILTER_SANITIZE_STRING
    $firstName = htmlspecialchars(trim($postData['firstName']), ENT_QUOTES, 'UTF-8');
    $lastName = htmlspecialchars(trim($postData['lastName']), ENT_QUOTES, 'UTF-8');
    $email = filter_var(trim($postData['email']), FILTER_SANITIZE_EMAIL);
    $phone = isset($postData['phone']) ? htmlspecialchars(trim($postData['phone']), ENT_QUOTES, 'UTF-8') : '';

    // Debug log
    error_log("Sanitized data: " . json_encode([
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'phone' => $phone
    ]));

    $database = new Database();
    $db = $database->getConnection();

    // Use named parameters instead of positional parameters
    $stmt = $db->prepare("
        INSERT INTO users (first_name, last_name, email, phone) 
        VALUES (:firstName, :lastName, :email, :phone) 
        RETURNING id
    ");

    $stmt->bindParam(':firstName', $firstName);
    $stmt->bindParam(':lastName', $lastName);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':phone', $phone);

    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $response['success'] = true;
    $response['message'] = 'User created successfully';
    $response['data'] = [
        'id' => $result['id'],
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'phone' => $phone
    ];

    error_log("User created successfully: " . json_encode($response));

} catch (Exception $e) {
    error_log("Error in create.php: " . $e->getMessage());
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    $response['debug'] = [
        'post_data' => $postData,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
}

echo json_encode($response);
?>
