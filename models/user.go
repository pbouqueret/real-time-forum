package models

import (
	"time"
)

// User represents a registered user in the system
type User struct {
	ID           int64     `json:"id"`
	UUID         string    `json:"uuid"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // Never expose password hash in JSON
	CreatedAt    time.Time `json:"created_at"`
}
