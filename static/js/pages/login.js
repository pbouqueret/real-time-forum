import { navigate } from '../utils/router.js';

export function render(container) {
    container.innerHTML = `
        <div class="auth-container">
            <h2>Login</h2>
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="identifier">Email or Username</label>
                    <input type="text" id="identifier" name="identifier" placeholder="Enter your email or username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Enter your password" required>
                </div>
                <div id="error-message" class="error-message"></div>
                <button type="submit" class="btn-primary">Login</button>
                <p class="auth-link">Don't have an account? <a href="#/register">Register</a></p>
            </form>
        </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        errorDiv.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            if (response.ok) {
                navigate('/');
            } else {
                const text = await response.text();
                errorDiv.textContent = text || 'Login failed';
            }
        } catch (error) {
            errorDiv.textContent = 'An error occurred. Please try again.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
}
