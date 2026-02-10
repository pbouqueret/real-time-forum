import { state } from './app.js';

let ws = null;
let reconnectTimer = null;
const listeners = {};

// Register a callback for a specific message type
export function on(type, callback) {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(callback);
}

// Remove listeners for a type
export function off(type) {
    delete listeners[type];
}

function dispatch(message) {
    const callbacks = listeners[message.type];
    if (callbacks) {
        callbacks.forEach(cb => cb(message));
    }
}

// Connect to WebSocket
export function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            dispatch(message);
        } catch (e) {
            console.error('WS parse error:', e);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        ws = null;
        // Reconnect after 3s if still authenticated
        if (state.isAuthenticated) {
            reconnectTimer = setTimeout(connect, 3000);
        }
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
    };
}

// Disconnect WebSocket
export function disconnect() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.close();
        ws = null;
    }
}

// Send a message through WebSocket
export function send(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// Send a private message
export function sendPrivateMessage(recipientId, content) {
    send({
        type: 'private_message',
        recipient_id: recipientId,
        payload: content,
    });
}

// Check if WebSocket is connected
export function isConnected() {
    return ws && ws.readyState === WebSocket.OPEN;
}
