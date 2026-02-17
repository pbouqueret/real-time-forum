import { state } from '../app.js';
import { on, off, sendPrivateMessage, connect } from '../websocket.js';

let selectedUserId = null;
let selectedUsername = '';
let onlineUsers = new Set();
let messageOffset = 0;
let loading = false;
let noMoreMessages = false;
let throttleTimer = null;

export async function render(container) {
    // Ensure WS is connected
    connect();

    container.innerHTML = `
        <div class="chat-layout">
            <aside class="chat-users-panel">
                <h3>Users</h3>
                <div id="usersList" class="users-list">
                    <div class="loading">Loading users...</div>
                </div>
            </aside>
            <section class="chat-window">
                <div id="chatHeader" class="chat-header">
                    <span>Select a user to start chatting</span>
                </div>
                <div id="chatMessages" class="chat-messages">
                    <div class="empty-state">Choose someone to chat with</div>
                </div>
                <form id="chatForm" class="chat-input-form hidden">
                    <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off" required>
                    <button type="submit" class="btn-primary">Send</button>
                </form>
            </section>
        </div>
    `;

    // Register WS listeners
    on('private_message', handleIncomingMessage);
    on('user_online', handleUserOnline);
    on('user_offline', handleUserOffline);

    // Load users
    await loadUsers();

    // Chat form submit
    document.getElementById('chatForm').addEventListener('submit', handleSendMessage);

    // Infinite scroll
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.addEventListener('scroll', handleScroll);
}

// Cleanup when leaving the page
export function cleanup() {
    off('private_message');
    off('user_online');
    off('user_offline');
}

async function loadUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    try {
        const response = await fetch('/api/chat/users');
        if (!response.ok) throw new Error('Failed to load users');

        const users = await response.json();

        if (!users || users.length === 0) {
            usersList.innerHTML = '<div class="empty-state">No other users yet</div>';
            return;
        }

        usersList.innerHTML = users.map(user => `
            <div class="user-item ${selectedUserId === user.id ? 'active' : ''}" data-id="${user.id}" data-username="${user.username}">
                <span class="user-status ${onlineUsers.has(user.id) ? 'online' : 'offline'}"></span>
                <span class="user-name">${user.username}</span>
            </div>
        `).join('');

        usersList.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = parseInt(item.dataset.id);
                const username = item.dataset.username;
                selectUser(userId, username);
            });
        });
    } catch (e) {
        usersList.innerHTML = '<div class="error-message">Failed to load users</div>';
    }
}

function selectUser(userId, username) {
    selectedUserId = userId;
    selectedUsername = username;
    messageOffset = 0;
    noMoreMessages = false;

    // Update active state in user list
    document.querySelectorAll('.user-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.id) === userId);
    });

    // Update header
    const header = document.getElementById('chatHeader');
    if (header) {
        const isOnline = onlineUsers.has(userId);
        header.innerHTML = `
            <span class="chat-header-name">${username}</span>
            <span class="chat-header-status ${isOnline ? 'online' : 'offline'}">${isOnline ? 'Online' : 'Offline'}</span>
        `;
    }

    // Show input
    document.getElementById('chatForm').classList.remove('hidden');
    document.getElementById('chatInput').focus();

    // Load messages
    loadMessages(true);
}

async function loadMessages(initial = false) {
    if (loading || (!initial && noMoreMessages)) return;
    loading = true;

    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    if (initial) {
        messagesDiv.innerHTML = '<div class="loading">Loading messages...</div>';
        messageOffset = 0;
    }

    try {
        const response = await fetch(
            `/api/chat/messages?user_id=${selectedUserId}&limit=10&offset=${messageOffset}`
        );
        if (!response.ok) throw new Error('Failed to load messages');

        const messages = await response.json();

        if (!messages || messages.length === 0) {
            noMoreMessages = true;
            if (initial) {
                messagesDiv.innerHTML = '<div class="empty-state">No messages yet. Say hello!</div>';
            }
            loading = false;
            return;
        }

        if (messages.length < 10) {
            noMoreMessages = true;
        }

        // Messages come in DESC order from API, reverse for display
        const reversed = [...messages].reverse();

        const html = reversed.map(msg => renderMessage(msg)).join('');

        if (initial) {
            messagesDiv.innerHTML = html;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } else {
            const prevHeight = messagesDiv.scrollHeight;
            messagesDiv.insertAdjacentHTML('afterbegin', html);
            // Maintain scroll position
            messagesDiv.scrollTop = messagesDiv.scrollHeight - prevHeight;
        }

        messageOffset += messages.length;
    } catch (e) {
        if (initial) {
            messagesDiv.innerHTML = '<div class="error-message">Failed to load messages</div>';
        }
    }

    loading = false;
}

function renderMessage(msg) {
    const isMine = msg.sender_id === state.currentUser.id;
    const time = formatTime(msg.created_at);
    const senderName = msg.sender_username || (isMine ? state.currentUser.username : selectedUsername);
    return `
        <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">
            <span class="bubble-sender">${escapeHtml(senderName)}</span>
            <p class="bubble-content">${escapeHtml(msg.content)}</p>
            <span class="bubble-time">${time}</span>
        </div>
    `;
}

function handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const content = input.value.trim();

    if (!content || !selectedUserId) return;

    sendPrivateMessage(selectedUserId, content);

    // Optimistic UI: add message immediately
    const messagesDiv = document.getElementById('chatMessages');
    if (messagesDiv) {
        // Remove empty state if present
        const emptyState = messagesDiv.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        messagesDiv.insertAdjacentHTML('beforeend', `
            <div class="chat-bubble mine">
                <span class="bubble-sender">${escapeHtml(state.currentUser.username)}</span>
                <p class="bubble-content">${escapeHtml(content)}</p>
                <span class="bubble-time">${formatTime(new Date().toISOString())}</span>
            </div>
        `);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    input.value = '';
    input.focus();
}

function handleIncomingMessage(wsMsg) {
    // wsMsg: { type, sender_id, recipient_id, payload }
    const senderId = wsMsg.sender_id;
    const content = wsMsg.payload;

    // Skip if it's our own message (already shown via optimistic UI)
    if (senderId === state.currentUser.id) return;

    // If we're chatting with this user, append the message
    if (senderId === selectedUserId) {
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            const emptyState = messagesDiv.querySelector('.empty-state');
            if (emptyState) emptyState.remove();

            const senderName = wsMsg.sender_username || selectedUsername;
            messagesDiv.insertAdjacentHTML('beforeend', `
                <div class="chat-bubble theirs">
                    <span class="bubble-sender">${escapeHtml(senderName)}</span>
                    <p class="bubble-content">${escapeHtml(content)}</p>
                    <span class="bubble-time">${formatTime(new Date().toISOString())}</span>
                </div>
            `);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }

    // Reload user list to update sorting
    loadUsers();
}

function handleUserOnline(wsMsg) {
    const payload = wsMsg.payload;
    if (payload && payload.user_id) {
        onlineUsers.add(payload.user_id);
        updateUserStatus(payload.user_id, true);
    }
}

function handleUserOffline(wsMsg) {
    const payload = wsMsg.payload;
    if (payload && payload.user_id) {
        onlineUsers.delete(payload.user_id);
        updateUserStatus(payload.user_id, false);
    }
}

function updateUserStatus(userId, isOnline) {
    // Update in user list
    const userItem = document.querySelector(`.user-item[data-id="${userId}"]`);
    if (userItem) {
        const dot = userItem.querySelector('.user-status');
        if (dot) {
            dot.classList.toggle('online', isOnline);
            dot.classList.toggle('offline', !isOnline);
        }
    }

    // Update chat header if this is the selected user
    if (userId === selectedUserId) {
        const headerStatus = document.querySelector('.chat-header-status');
        if (headerStatus) {
            headerStatus.className = `chat-header-status ${isOnline ? 'online' : 'offline'}`;
            headerStatus.textContent = isOnline ? 'Online' : 'Offline';
        }
    }
}

function handleScroll() {
    if (throttleTimer) return;
    throttleTimer = setTimeout(() => {
        throttleTimer = null;
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv && messagesDiv.scrollTop < 50 && !loading && !noMoreMessages) {
            loadMessages(false);
        }
    }, 200);
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
