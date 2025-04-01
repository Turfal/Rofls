const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');
const messageDiv = document.getElementById('message');

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Reset previous error states
    usernameInput.classList.remove('error-input');
    passwordInput.classList.remove('error-input');
    usernameError.style.display = 'none';
    passwordError.style.display = 'none';
    messageDiv.style.display = 'none';

    // Client-side validation
    let hasError = false;
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username.length < 3) {
        usernameInput.classList.add('error-input');
        usernameError.style.display = 'block';
        hasError = true;
    }

    if (password.length < 6) {
        passwordInput.classList.add('error-input');
        passwordError.style.display = 'block';
        hasError = true;
    }

    if (hasError) return;

    // Proceed with login
    const formData = { username, password };

    fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Login failed');
            }
        })
        .then(data => {
            localStorage.setItem('jwt_token', data.token);
            messageDiv.textContent = 'Login successful! Redirecting...';
            messageDiv.className = 'message success';
            messageDiv.style.display = 'block';
            setTimeout(() => {
                window.location.href = '/home';
            }, 1000);
        })
        .catch(error => {
            messageDiv.textContent = 'Login failed. Please check your credentials.';
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

passwordInput.addEventListener('input', () => {
    if (passwordInput.value.trim().length < 6) {
        passwordInput.classList.add('error-input');
        passwordError.style.display = 'block';
    } else {
        passwordInput.classList.remove('error-input');
        passwordError.style.display = 'none';
    }
});

// Check for URL params
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('logout')) {
    messageDiv.textContent = 'You have been successfully logged out.';
    messageDiv.className = 'message success';
    messageDiv.style.display = 'block';
} else if (urlParams.has('error')) {
    messageDiv.textContent = 'Invalid username or password.';
    messageDiv.className = 'message error';
    messageDiv.style.display = 'block';
}