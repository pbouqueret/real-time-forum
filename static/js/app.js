import { connect, disconnect } from './websocket.js';

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
            const wasAuthenticated = state.isAuthenticated;
            state.currentUser = user;
            state.isAuthenticated = true;
            // Connect WS on first auth
            if (!wasAuthenticated) connect();
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
    connect();
    updateNavbar();
}

// Clear user on logout
export function clearUser() {
    state.currentUser = null;
    state.isAuthenticated = false;
    disconnect();
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

    const currentPath = window.location.hash.slice(1) || '/';

    if (state.isAuthenticated && state.currentUser) {
        nav.innerHTML = `
            <a href="#/" class="nav-brand">Real-Time Forum</a>
            <div class="nav-right">
                <a href="#/" class="nav-link ${currentPath === '/' ? 'active' : ''}">Forum</a>
                <a href="#/chat" class="nav-link ${currentPath === '/chat' ? 'active' : ''}">Chat</a>
                <span class="nav-user">${state.currentUser.username}</span>
                <button id="logoutBtn" class="btn-logout">Logout</button>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        nav.innerHTML = `
            <a href="#/" class="nav-brand">Real-Time Forum</a>
            <div class="nav-right">
                <a href="#/login" class="nav-link ${currentPath === '/login' ? 'active' : ''}">Login</a>
                <a href="#/register" class="nav-link ${currentPath === '/register' ? 'active' : ''}">Register</a>
            </div>
        `;
    }
}
