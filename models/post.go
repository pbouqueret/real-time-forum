package models

import (
	"time"
)

// Post represents a forum discussion
type Post struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Category  string    `json:"category"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// PostWithAuthor includes the author's username for display
type PostWithAuthor struct {
	Post
	Author string `json:"author"`
}
