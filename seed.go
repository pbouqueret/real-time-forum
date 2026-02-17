// +build ignore

package main

import (
	"fmt"
	"log"
	"real-time-forum/database"
	"real-time-forum/models"
	"real-time-forum/utils"
	"time"

	"github.com/gofrs/uuid"
)

func main() {
	// Initialize database
	if err := database.InitDB("./forum.db"); err != nil {
		log.Fatal(err)
	}
	defer database.DB.Close()

	fmt.Println("Seeding database...")

	// Create 3 test users
	users := []struct {
		Username  string
		FirstName string
		LastName  string
		Age       int
		Gender    string
		Email     string
		Password  string
	}{
		{"alice", "Alice", "Smith", 25, "female", "alice@demo.com", "password123"},
		{"bob", "Bob", "Jones", 28, "male", "bob@demo.com", "password123"},
		{"charlie", "Charlie", "Brown", 22, "male", "charlie@demo.com", "password123"},
	}

	var userIDs []int64

	for _, u := range users {
		hash, _ := utils.HashPassword(u.Password)
		uid, _ := uuid.NewV4()
		user := &models.User{
			UUID:         uid.String(),
			Username:     u.Username,
			Age:          u.Age,
			Gender:       u.Gender,
			FirstName:    u.FirstName,
			LastName:     u.LastName,
			Email:        u.Email,
			PasswordHash: hash,
		}
		if err := database.CreateUser(user); err != nil {
			fmt.Printf("  User %s already exists, skipping\n", u.Username)
			continue
		}
		userIDs = append(userIDs, user.ID)
		fmt.Printf("  Created user: %s (password: %s)\n", u.Username, u.Password)
	}

	if len(userIDs) < 3 {
		fmt.Println("Users already seeded. Done.")
		return
	}

	// Create posts
	posts := []struct {
		UserIdx  int
		Title    string
		Content  string
		Category string
	}{
		{0, "Welcome to the Forum!", "This is our real-time forum built with Go, SQLite and Vanilla JS. Feel free to explore and try out all the features!", "General"},
		{1, "How WebSockets work in Go", "WebSockets provide full-duplex communication between client and server. In Go, we use gorilla/websocket to upgrade HTTP connections. The Hub pattern with goroutines and channels handles message routing efficiently.", "Technology"},
		{2, "Need help with CSS Grid", "I'm trying to create a responsive layout with CSS Grid. Any tips on how to handle the sidebar and main content area?", "Help"},
		{0, "Best practices for SPA routing", "When building a Single Page Application without a framework, hash-based routing is a solid approach. We use hashchange events and dynamic module imports for code splitting.", "Technology"},
		{1, "Weekend plans?", "Anyone up for a coding session this weekend? We could work on some open source projects together.", "Off-Topic"},
	}

	var postIDs []int64

	for _, p := range posts {
		post := &models.Post{
			UserID:   userIDs[p.UserIdx],
			Title:    p.Title,
			Content:  p.Content,
			Category: p.Category,
		}
		if err := database.CreatePost(post); err != nil {
			log.Printf("  Failed to create post: %v", err)
			continue
		}
		postIDs = append(postIDs, post.ID)
		fmt.Printf("  Created post: %s\n", p.Title)
	}

	// Create comments
	comments := []struct {
		PostIdx int
		UserIdx int
		Content string
	}{
		{0, 1, "Great work on the forum! The real-time features are impressive."},
		{0, 2, "Love the clean design. The SPA feels really smooth."},
		{1, 0, "Nice explanation! The Hub pattern with channels is really elegant."},
		{1, 2, "I found that ping/pong is essential for detecting disconnections."},
		{2, 0, "Try using grid-template-areas, it makes responsive layouts much easier!"},
		{3, 1, "Dynamic imports are a great way to keep the initial bundle small."},
	}

	for _, c := range comments {
		if c.PostIdx >= len(postIDs) {
			continue
		}
		comment := &models.Comment{
			UserID:  userIDs[c.UserIdx],
			PostID:  postIDs[c.PostIdx],
			Content: c.Content,
		}
		if err := database.CreateComment(comment); err != nil {
			log.Printf("  Failed to create comment: %v", err)
			continue
		}
		fmt.Printf("  Created comment on post #%d\n", postIDs[c.PostIdx])
	}

	// Create some messages between users
	messages := []struct {
		SenderIdx   int
		ReceiverIdx int
		Content     string
		MinutesAgo  int
	}{
		{0, 1, "Hey Bob! How's the WebSocket implementation going?", 30},
		{1, 0, "Going well! Just finished the Hub with private message routing.", 28},
		{0, 1, "Awesome! I've got the frontend chat UI ready for testing.", 25},
		{1, 0, "Let me check it out. The infinite scroll works?", 20},
		{0, 1, "Yes! Loads 10 messages at a time with throttle.", 18},
		{2, 0, "Alice, can you review my CSS changes?", 15},
		{0, 2, "Sure! I'll take a look this afternoon.", 10},
	}

	for _, m := range messages {
		msg := &models.Message{
			SenderID:    userIDs[m.SenderIdx],
			RecipientID: userIDs[m.ReceiverIdx],
			Content:     m.Content,
			CreatedAt:   time.Now().Add(-time.Duration(m.MinutesAgo) * time.Minute),
		}
		if err := database.CreateMessage(msg); err != nil {
			log.Printf("  Failed to create message: %v", err)
			continue
		}
		fmt.Printf("  Created message: %s -> %s\n", users[m.SenderIdx].Username, users[m.ReceiverIdx].Username)
	}

	fmt.Println("\nSeed complete!")
	fmt.Println("\nDemo accounts:")
	fmt.Println("  alice / password123")
	fmt.Println("  bob   / password123")
	fmt.Println("  charlie / password123")
}
