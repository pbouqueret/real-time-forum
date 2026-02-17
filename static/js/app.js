import { connect, disconnect, on, off } from './websocket.js';

// App State - Single source of truth for the SPA
export const state = {
    currentUser: null,
    isAuthenticated: false,
    onlineUsers: new Set(),
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
            if (!wasAuthenticated) {
                connect();
                registerGlobalWSListeners();
            }
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
    registerGlobalWSListeners();
    updateNavbar();
}

// Clear user on logout
export function clearUser() {
    state.currentUser = null;
    state.isAuthenticated = false;
    state.onlineUsers.clear();
    unregisterGlobalWSListeners();
    disconnect();
    updateNavbar();
    updateSidebar();
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

// ===== Global Online/Offline Sidebar =====

let globalListenersRegistered = false;

function registerGlobalWSListeners() {
    if (globalListenersRegistered) return;
    on('global_user_online', handleGlobalUserOnline);
    on('global_user_offline', handleGlobalUserOffline);
    globalListenersRegistered = true;
    // Load initial user list
    loadSidebarUsers();
}

function unregisterGlobalWSListeners() {
    off('global_user_online');
    off('global_user_offline');
    globalListenersRegistered = false;
}

function handleGlobalUserOnline(wsMsg) {
    const payload = wsMsg.payload;
    if (payload && payload.user_id) {
        state.onlineUsers.add(payload.user_id);
        updateSidebarUserStatus(payload.user_id, true);
    }
}

function handleGlobalUserOffline(wsMsg) {
    const payload = wsMsg.payload;
    if (payload && payload.user_id) {
        state.onlineUsers.delete(payload.user_id);
        updateSidebarUserStatus(payload.user_id, false);
    }
}

export async function loadSidebarUsers() {
    const sidebar = document.getElementById('onlineSidebar');
    const usersList = document.getElementById('sidebarUsersList');
    if (!sidebar || !usersList) return;

    if (!state.isAuthenticated) {
        sidebar.classList.add('hidden');
        return;
    }

    sidebar.classList.remove('hidden');

    try {
        const response = await fetch('/api/chat/users');
        if (!response.ok) return;

        const users = await response.json();
        if (!users || users.length === 0) {
            usersList.innerHTML = '<div class="sidebar-empty">No users</div>';
            return;
        }

        usersList.innerHTML = users.map(user => `
            <a href="#/chat" class="sidebar-user-item" data-id="${user.id}">
                <span class="user-status ${state.onlineUsers.has(user.id) ? 'online' : 'offline'}"></span>
                <span class="sidebar-user-name">${user.username}</span>
            </a>
        `).join('');
    } catch (e) {
        // Silently fail
    }
}

export function updateSidebar() {
    const sidebar = document.getElementById('onlineSidebar');
    if (!sidebar) return;

    if (!state.isAuthenticated) {
        sidebar.classList.add('hidden');
    } else {
        sidebar.classList.remove('hidden');
        loadSidebarUsers();
    }
}

function updateSidebarUserStatus(userId, isOnline) {
    const userItem = document.querySelector(`.sidebar-user-item[data-id="${userId}"]`);
    if (userItem) {
        const dot = userItem.querySelector('.user-status');
        if (dot) {
            dot.classList.toggle('online', isOnline);
            dot.classList.toggle('offline', !isOnline);
        }
    }
}
