import { navigate } from '../utils/router.js';

export function render(container) {
    container.innerHTML = `
        <h2>Login</h2>
        <form id="loginForm">
            <div class="form-group">
                <label for="identifier">Email or Username</label>
                <input type="text" id="identifier" name="identifier" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Login</button>
            <p>Don't have an account? <a href="#/register">Register</a></p>
        </form>
        <div id="error-message" style="color: red;"></div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });

            if (response.ok) {
                navigate('/');
            } else {
                const data = await response.json();
                errorDiv.textContent = data.message || 'Login failed';
            }
        } catch (error) {
            errorDiv.textContent = 'An error occurred. Please try again.';
        }
    });
}
