import { navigate } from '../utils/router.js';
import { success as showSuccess, error as showError } from '../utils/toast.js';

export function render(container) {
    container.innerHTML = `
        <div class="auth-container">
            <h2>Register</h2>
            <form id="registerForm" class="auth-form">
                <div class="form-group">
                    <label for="username">Nickname</label>
                    <input type="text" id="username" name="username" placeholder="Choose a nickname" required minlength="3">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" name="firstName" placeholder="First name" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" name="lastName" placeholder="Last name" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="age">Age</label>
                        <input type="number" id="age" name="age" placeholder="Age" required min="1" max="150">
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender</label>
                        <select id="gender" name="gender" required>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Choose a password" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required>
                </div>
                <div id="error-message" class="error-message"></div>
                <button type="submit" class="btn-primary">Register</button>
                <p class="auth-link">Already have an account? <a href="#/login">Login</a></p>
            </form>
        </div>
    `;

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const age = parseInt(document.getElementById('age').value, 10);
        const gender = document.getElementById('gender').value;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('error-message');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        errorDiv.textContent = '';

        // Client-side validation
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            return;
        }

        if (!gender) {
            errorDiv.textContent = 'Please select a gender';
            return;
        }

        if (isNaN(age) || age <= 0) {
            errorDiv.textContent = 'Please enter a valid age';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    age,
                    gender,
                    email,
                    password,
                }),
            });

            if (response.ok) {
                showSuccess('Account created! Please login.');
                navigate('/login');
            } else {
                const text = await response.text();
                errorDiv.textContent = text || 'Registration failed';
            }
        } catch (err) {
            showError('Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    });
}
