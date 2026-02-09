package main

import (
	"log"
	"net/http"
	"os"
	"real-time-forum/database"
	"real-time-forum/websocket"
)

func main() {
	port := "8080"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	// Initialize Database
	dbPath := "./forum.db"
	err := database.InitDB(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.DB.Close()

	// Initialize WebSocket Hub
	hub := websocket.NewHub()
	go hub.Run()

	// Serve Static Files
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	// WebSocket Endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(hub, w, r)
	})

	log.Printf("Server starting on http://localhost:%s", port)
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
