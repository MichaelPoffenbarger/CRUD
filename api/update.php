<?php
header('Content-Type: application/json');
require_once '../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$response = ['success' => false, 'message' => ''];

try {
    $id = $_POST['id'];
    $firstName = $_POST['firstName'];
    $lastName = $_POST['lastName'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];

    $stmt = $db->prepare("UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4 WHERE id = $5");
    $stmt->execute([$firstName, $lastName, $email, $phone, $id]);

    $response['success'] = true;
    $response['message'] = 'User updated successfully';
} catch (PDOException $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>
