package websocket

import (
	"encoding/json"
	"log"
	"real-time-forum/models"
)

// Hub maintains the set of active clients and broadcasts messages.
type Hub struct {
	// Registered clients map[UserID]map[*Client]bool
	// One user can have multiple connections (tabs)
	clients map[int64]map[*Client]bool

	// Inbound messages from the clients.
	// We change this to accept parsed messages or struct that contains sender info
	// For simplicity, we can keep using []byte or switch to a struct channel.
	// Let's stick to reading parsed messages in readPump or passing raw bytes?
	// To strictly follow "private_msg", we need to know who sent it and where it goes.
	// Let's effectively change 'broadcast' to handle routing.
	broadcast chan *models.WSMessage

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

// NewHub initializes a new Hub
func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan *models.WSMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[int64]map[*Client]bool),
	}
}

// Run starts the Hub main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			if h.clients[client.UserID] == nil {
				h.clients[client.UserID] = make(map[*Client]bool)
				// Notify others that this user is online
				h.broadcastPresence(client.UserID, true)
			}
			h.clients[client.UserID][client] = true
			log.Printf("Client registered: UserID %d", client.UserID)

		case client := <-h.unregister:
			if userClients, ok := h.clients[client.UserID]; ok {
				if _, ok := userClients[client]; ok {
					delete(userClients, client)
					close(client.send)
					if len(userClients) == 0 {
						delete(h.clients, client.UserID)
						// Notify others that this user is offline
						h.broadcastPresence(client.UserID, false)
					}
				}
			}
			log.Printf("Client unregistered: UserID %d", client.UserID)

		case message := <-h.broadcast:
			// Routing logic
			if message.Type == models.TypePrivateMessage {
				// Send to recipient
				if clients, ok := h.clients[message.RecipientID]; ok {
					h.sendToClients(clients, message)
				}
				// Also send back to sender (echo) so they see it in their chat window?
				// Usually frontend handles optimistic UI or we send confirmation.
				// Let's send to sender's other tabs too
				if clients, ok := h.clients[message.SenderID]; ok {
					h.sendToClients(clients, message)
				}
			} else if message.Type == models.TypeBroadcast || message.Type == models.TypeUserOnline || message.Type == models.TypeUserOffline {
				// Broadcast to everyone
				for _, clients := range h.clients {
					h.sendToClients(clients, message)
				}
			}
		}
	}
}

func (h *Hub) sendToClients(clients map[*Client]bool, message *models.WSMessage) {
	jsonMsg, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error ensuring JSON marshal: %v", err)
		return
	}

	for client := range clients {
		select {
		case client.send <- jsonMsg:
		default:
			close(client.send)
			delete(clients, client)
		}
	}
}

func (h *Hub) broadcastPresence(userID int64, online bool) {
	// We need username here. For now let's just send ID or doing a quick DB lookup?
	// Ideally Client struct has Username too.
	// We will implement a quick lookup or assume ID is enough for frontend to fetch details?
	// Let's send a specific message type.
	msg := &models.WSMessage{
		Type: func() models.WSMessageType {
			if online {
				return models.TypeUserOnline
			}
			return models.TypeUserOffline
		}(),
		Payload: models.UserStatusPayload{
			UserID: userID,
			Online: online,
		},
	}
	// Send to all
	for _, clients := range h.clients {
		h.sendToClients(clients, msg)
	}
}
