// App State - Single source of truth for the SPA
export const state = {
    currentUser: null,
    isAuthenticated: false,
};

// Check auth status by calling /api/me
export async function checkAuth() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            state.currentUser = user;
            state.isAuthenticated = true;
            return true;
        }
    } catch (e) {
        // Network error
    }
    state.currentUser = null;
    state.isAuthenticated = false;
    return false;
}

// Set user after login
export function setUser(user) {
    state.currentUser = user;
    state.isAuthenticated = true;
    updateNavbar();
}

// Clear user on logout
export function clearUser() {
    state.currentUser = null;
    state.isAuthenticated = false;
    updateNavbar();
}

// Logout action
export async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
        // Continue even if request fails
    }
    clearUser();
    window.location.hash = '#/login';
}

// Update navbar based on auth state
export function updateNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;

    if (state.isAuthenticated && state.currentUser) {
        nav.innerHTML = `
            <a href="#/" class="nav-brand">Real-Time Forum</a>
            <div class="nav-right">
                <span class="nav-user">${state.currentUser.username}</span>
                <button id="logoutBtn" class="btn-logout">Logout</button>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        nav.innerHTML = `
            <a href="#/" class="nav-brand">Real-Time Forum</a>
            <div class="nav-right">
                <a href="#/login" class="nav-link">Login</a>
                <a href="#/register" class="nav-link">Register</a>
            </div>
        `;
    }
}
