import { state } from '../app.js';

export function render(container) {
    const username = state.currentUser ? state.currentUser.username : 'User';

    container.innerHTML = `
        <div class="container">
            <div class="welcome-section">
                <h2>Welcome, ${username}!</h2>
                <p>The forum is under construction. Posts and categories are coming soon.</p>
            </div>
        </div>
    `;
}
