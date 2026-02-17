package models

// WSMessageType defines the type of websocket message
type WSMessageType string

const (
	TypePrivateMessage WSMessageType = "private_message"
	TypeUserOnline     WSMessageType = "user_online"
	TypeUserOffline    WSMessageType = "user_offline"
	TypeBroadcast      WSMessageType = "broadcast"
)

// WSMessage represents the structure of messages sent over WebSocket
type WSMessage struct {
	Type           WSMessageType `json:"type"`
	Payload        interface{}   `json:"payload,omitempty"`
	RecipientID    int64         `json:"recipient_id,omitempty"` // For private messages
	SenderID       int64         `json:"sender_id,omitempty"`
	SenderUsername string        `json:"sender_username,omitempty"`
	CreatedAt      string        `json:"created_at,omitempty"`
}

// UserStatusPayload is sent when a user goes online/offline
type UserStatusPayload struct {
	UserID   int64  `json:"user_id"`
	Nickname string `json:"nickname"`
	Online   bool   `json:"online"`
}
