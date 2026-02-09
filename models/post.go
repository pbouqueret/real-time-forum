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
