// Registro de usuario
function registerUser(event) {
    event.preventDefault();
    
    const userData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };

    // Validaciones
    if (userData.password !== userData.confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }

    if (userData.password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    // Simular registro exitoso
    localStorage.setItem('user', JSON.stringify(userData));
    showAlert('Registro exitoso! Redirigiendo...', 'success');
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// Inicio de sesión
function loginUser(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Simular login (aquí iría la validación con backend)
    if (email && password) {
        localStorage.setItem('token', 'fake-jwt-token');
        showAlert('Inicio de sesión exitoso', 'success');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    } else {
        showAlert('Credenciales inválidas', 'error');
    }
}

// Recuperar contraseña
function recoverPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    
    // Simular envío de email
    showAlert('Se ha enviado un enlace de recuperación a tu email', 'success');
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// Mostrar alertas
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.parentNode.insertBefore(alertDiv, form);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}