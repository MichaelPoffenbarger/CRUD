$(document).ready(function() {
    // Load users when page loads
    loadUsers();

    // Handle form submission
    $('#userForm').on('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted'); // Debug log

        if (!validateForm()) {
            console.log('Form validation failed'); // Debug log
            return;
        }
        
        const userData = {
            firstName: $('#firstName').val().trim(),
            lastName: $('#lastName').val().trim(),
            email: $('#email').val().trim(),
            phone: $('#phone').val().trim()
        };

        console.log('Collected form data:', userData); // Debug log
        const userId = $('#userId').val();
        if (userId) {
            updateUser(userId, userData);
        } else {
            createUser(userData);
        }
    });

    // Cancel edit
    $('#cancelBtn').on('click', function() {
        resetForm();
    });

    // Add form validation
    function validateForm() {
        let isValid = true;
        const requiredFields = ['firstName', 'lastName', 'email'];
        
        requiredFields.forEach(field => {
            const input = $(`#${field}`);
            const value = input.val().trim();
            console.log(`Validating ${field}:`, value); // Debug log
            
            if (!value) {
                input.addClass('is-invalid');
                isValid = false;
            } else {
                input.removeClass('is-invalid');
            }
        });

        return isValid;
    }

    // Add input event listeners for validation
    $('#userForm input').on('input', function() {
        $(this).removeClass('is-invalid');
    });

    // Test the API endpoint
    function testApiEndpoint() {
        $.ajax({
            url: 'api/create.php',
            method: 'GET',
            success: function(response) {
                console.log('API test response:', response);
            },
            error: function(xhr, status, error) {
                console.error('API test error:', {
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
            }
        });
    }

    // Call this function when the page loads to test the endpoint
    console.log('Page loaded, testing API endpoint...');
    testApiEndpoint();
});

// Function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Function to format date
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Function to load users
function loadUsers() {
    // Show loading indicator
    $('#userTableBody').html('<tr><td colspan="5" class="text-center">Loading...</td></tr>');

    $.ajax({
        url: 'api/read.php',
        method: 'GET',
        success: function(response) {
            console.log('Load users response:', response); // Debug log

            if (response.success && response.data) {
                const users = response.data;
                let html = '';
                
                if (users.length === 0) {
                    html = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
                } else {
                    users.forEach(user => {
                        html += `
                            <tr>
                                <td>${escapeHtml(user.first_name)}</td>
                                <td>${escapeHtml(user.last_name)}</td>
                                <td>${escapeHtml(user.email)}</td>
                                <td>${user.phone ? escapeHtml(user.phone) : '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary edit-user" data-id="${user.id}">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                }
                
                $('#userTableBody').html(html);
                
                // Attach event handlers
                $('.edit-user').on('click', function() {
                    const userId = $(this).data('id');
                    editUser(userId);
                });
                
                $('.delete-user').on('click', function() {
                    const userId = $(this).data('id');
                    deleteUser(userId);
                });
            } else {
                $('#userTableBody').html(
                    '<tr><td colspan="5" class="text-center text-danger">' +
                    (response.message || 'Failed to load users') +
                    '</td></tr>'
                );
                console.error('Failed to load users:', response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Load users AJAX error:', {
                status: status,
                error: error,
                response: xhr.responseText
            });
            
            $('#userTableBody').html(
                '<tr><td colspan="5" class="text-center text-danger">' +
                'Error loading users. Please try again.' +
                '</td></tr>'
            );
        }
    });
}

function createUser(userData) {
    console.log('Attempting to create user with data:', userData);

    // Validate data before sending
    if (!userData.firstName || !userData.lastName || !userData.email) {
        showAlert('error', 'Validation Error', 'Please fill in all required fields');
        return;
    }

    // Show loading state
    const submitBtn = $('#submitBtn');
    const originalText = submitBtn.text();
    submitBtn.prop('disabled', true).text('Creating...');

    $.ajax({
        url: 'api/create.php',
        method: 'POST',
        data: JSON.stringify(userData),
        contentType: 'application/json',
        success: function(response) {
            console.log('Server response:', response);
            if (response.success) {
                showAlert('success', 'Success', 'User created successfully');
                loadUsers();
                resetForm();
            } else {
                showAlert('error', 'Error', response.message || 'Failed to create user');
                console.error('Server error details:', response);
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX Error Details:', {
                status: status,
                error: error,
                responseText: xhr.responseText,
                statusText: xhr.statusText,
                readyState: xhr.readyState,
                statusCode: xhr.status
            });

            let errorMessage = 'Failed to create user. ';
            if (xhr.responseText) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage += response.message || '';
                } catch (e) {
                    errorMessage += xhr.responseText;
                }
            }
            showAlert('error', 'Error', errorMessage);
        },
        complete: function() {
            // Reset button state
            submitBtn.prop('disabled', false).text(originalText);
        }
    });
}

function updateUser(id, userData) {
    $.ajax({
        url: 'api/update.php',
        method: 'POST',
        data: { id: id, ...userData },
        success: function(response) {
            if (response.success) {
                showAlert('success', 'Success', 'User updated successfully');
                loadUsers();
                resetForm();
            } else {
                showAlert('error', 'Error', response.message);
            }
        },
        error: function() {
            showAlert('error', 'Error', 'Failed to update user');
        }
    });
}

function deleteUser(userId) {
    // Add confirmation dialog
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Show loading state
            Swal.fire({
                title: 'Deleting...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Send delete request
            $.ajax({
                url: 'api/delete.php',
                method: 'POST',
                data: JSON.stringify({ id: userId }),
                contentType: 'application/json',
                success: function(response) {
                    console.log('Delete response:', response);
                    
                    if (response.success) {
                        Swal.fire(
                            'Deleted!',
                            'User has been deleted.',
                            'success'
                        );
                        loadUsers(); // Refresh the users list
                    } else {
                        Swal.fire(
                            'Error!',
                            response.message || 'Failed to delete user',
                            'error'
                        );
                        console.error('Delete error:', response);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Delete AJAX Error:', {
                        status: status,
                        error: error,
                        response: xhr.responseText
                    });
                    
                    Swal.fire(
                        'Error!',
                        'Failed to delete user. Please try again.',
                        'error'
                    );
                }
            });
        }
    });
}

function editUser(user) {
    $('#userId').val(user.id);
    $('#firstName').val(user.first_name);
    $('#lastName').val(user.last_name);
    $('#email').val(user.email);
    $('#phone').val(user.phone);
    $('#submitBtn').text('Update User');
    $('#cancelBtn').show();
}

function resetForm() {
    $('#userForm')[0].reset();
    $('#userId').val('');
    $('#submitBtn').text('Add User');
    $('#cancelBtn').hide();
    $('.is-invalid').removeClass('is-invalid');
}

function displayUsers(users) {
    const tbody = $('#userTableBody');
    tbody.empty();

    users.forEach(user => {
        tbody.append(`
            <tr>
                <td>${user.id}</td>
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser(${JSON.stringify(user)})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `);
    });
}

function showAlert(type, title, message) {
    Swal.fire({
        icon: type,
        title: title,
        text: message,
        timer: type === 'success' ? 2000 : undefined,
        showConfirmButton: type !== 'success'
    });
}
