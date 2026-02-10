package main

import (
	"log"
	"net/http"
	"os"
	"real-time-forum/database"
	"real-time-forum/handlers"
	"real-time-forum/middleware"
	"real-time-forum/websocket"
	"strings"
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

	// Auth Endpoints
	http.HandleFunc("/api/register", handlers.RegisterHandler)
	http.HandleFunc("/api/login", handlers.LoginHandler)
	http.HandleFunc("/api/logout", handlers.LogoutHandler)
	http.HandleFunc("/api/me", middleware.AuthMiddleware(handlers.MeHandler)) // Assuming MeHandler exists from PR #1

	// Chat Endpoints
	http.HandleFunc("/api/chat/users", middleware.AuthMiddleware(handlers.GetChatUsersHandler))
	http.HandleFunc("/api/chat/messages", middleware.AuthMiddleware(handlers.GetMessagesHandler))

	// Posts Endpoints
	http.HandleFunc("/api/posts", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			middleware.AuthMiddleware(handlers.PostsHandler)(w, r)
		} else {
			handlers.PostsHandler(w, r)
		}
	})
	http.HandleFunc("/api/posts/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/comments") {
			if r.Method == http.MethodPost {
				middleware.AuthMiddleware(handlers.CommentsHandler)(w, r)
			} else {
				handlers.CommentsHandler(w, r)
			}
		} else {
			handlers.PostDetailHandler(w, r)
		}
	})

	// Categories Endpoint
	http.HandleFunc("/api/categories", handlers.CategoriesHandler)

	log.Printf("Server starting on http://localhost:%s", port)
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
