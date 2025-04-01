const registrationForm = document.getElementById('registrationForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('username-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const messageDiv = document.getElementById('message');

registrationForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Reset previous error states
    usernameInput.classList.remove('error-input');
    emailInput.classList.remove('error-input');
    passwordInput.classList.remove('error-input');
    usernameError.style.display = 'none';
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    messageDiv.style.display = 'none';

    // Client-side validation
    let hasError = false;
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (username.length < 3) {
        usernameInput.classList.add('error-input');
        usernameError.style.display = 'block';
        hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailInput.classList.add('error-input');
        emailError.style.display = 'block';
        hasError = true;
    }

    if (password.length < 6) {
        passwordInput.classList.add('error-input');
        passwordError.style.display = 'block';
        hasError = true;
    }

    if (hasError) return;

    // Proceed with registration
    const formData = { username, email, password };

    fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Registration failed');
            }
        })
        .then(data => {
            localStorage.setItem('jwt_token', data.token);
            messageDiv.textContent = 'Registration successful! Redirecting...';
            messageDiv.className = 'message success';
            messageDiv.style.display = 'block';
            setTimeout(() => {
                window.location.href = '/home';
            }, 1000);
        })
        .catch(error => {
            messageDiv.textContent = 'Registration failed. Please try again.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        });
});

// Real-time validation
usernameInput.addEventListener('input', () => {
    if (usernameInput.value.trim().length < 3) {
        usernameInput.classList.add('error-input');
        usernameError.style.display = 'block';
    } else {
        usernameInput.classList.remove('error-input');
        usernameError.style.display = 'none';
    }
});

emailInput.addEventListener('input', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('error-input');
        emailError.style.display = 'block';
    } else {
        emailInput.classList.remove('error-input');
        emailError.style.display = 'none';
    }
});

passwordInput.addEventListener('input', () => {
    if (passwordInput.value.trim().length < 6) {
        passwordInput.classList.add('error-input');
        passwordError.style.display = 'block';
    } else {
        passwordInput.classList.remove('error-input');
        passwordError.style.display = 'none';
    }
});