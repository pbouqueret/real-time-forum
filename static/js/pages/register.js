import { navigate } from '../utils/router.js';

export function render(container) {
    container.innerHTML = `
        <h2>Register</h2>
        <form id="registerForm">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Register</button>
            <p>Already have an account? <a href="#/login">Login</a></p>
        </form>
        <div id="error-message" style="color: red;"></div>
    `;

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                alert('Registration successful! Please login.');
                navigate('/login');
            } else {
                const data = await response.json();
                errorDiv.textContent = data.message || 'Registration failed';
            }
        } catch (error) {
            errorDiv.textContent = 'An error occurred. Please try again.';
        }
    });
}
