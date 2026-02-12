package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"real-time-forum/database"
	"real-time-forum/models"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Determine if the origin is allowed (CORS) - in dev, allow all
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte

	// UserID associated with this client
	UserID int64
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Parse the incoming JSON message
		var wsMsg models.WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("error unmarshalling message: %v", err)
			continue
		}

		// Enforce sender ID from the session (security)
		wsMsg.SenderID = c.UserID

		// Log logic: Store message if private
		if wsMsg.Type == models.TypePrivateMessage {
			// Save to DB
			// We need to extract content from payload. Payload is interface{}.
			// This part is tricky if Payload is map[string]interface{}.
			// Let's assume Payload is just the string content for now or a struct.
			// Let's assume it's string content for simplicity or check type.
			if content, ok := wsMsg.Payload.(string); ok {
				now := time.Now()
				msg := &models.Message{
					SenderID:    c.UserID,
					RecipientID: wsMsg.RecipientID,
					Content:     content,
					CreatedAt:   now,
				}
				if err := database.CreateMessage(msg); err != nil {
					log.Printf("Error saving message: %v", err)
				}
				// Update timestamp in msg for the broadcast
				wsMsg.CreatedAt = now.Format(time.RFC3339)
				wsMsg.Payload = content // Ensure payload is set correctly
			}
		}

		c.hub.broadcast <- &wsMsg
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWs handles websocket requests from the peer.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// Authenticate user
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	session, err := database.GetSessionByToken(cookie.Value)
	if err != nil || session == nil || session.ExpiresAt.Before(time.Now()) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: session.UserID,
	}
	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}
