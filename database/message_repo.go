package database

import (
	"database/sql"
	"real-time-forum/models"
)

// CreateMessage inserts a new private message
func CreateMessage(msg *models.Message) error {
	stmt, err := DB.Prepare("INSERT INTO messages(sender_id, recipient_id, content, created_at) VALUES(?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(msg.SenderID, msg.RecipientID, msg.Content, msg.CreatedAt)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	msg.ID = id
	return nil
}

// GetMessagesBetweenUsers retrieves the conversation history with pagination
func GetMessagesBetweenUsers(user1ID, user2ID int64, limit, offset int) ([]*models.Message, error) {
	query := `
		SELECT id, sender_id, recipient_id, content, created_at, is_read
		FROM messages
		WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := DB.Query(query, user1ID, user2ID, user2ID, user1ID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*models.Message
	for rows.Next() {
		msg := &models.Message{}
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.RecipientID, &msg.Content, &msg.CreatedAt, &msg.IsRead); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, nil
}

// GetChatUsers retrieves users sorted by the last message exchanged with the current user
// Users with no messages come after, sorted alphabetically
func GetChatUsers(currentUserID int64) ([]*models.User, error) {
	// Logic:
	// 1. Get all users except current one.
	// 2. Join with messages to find the latest message date for each user (sent or received).
	// 3. Order by that date DESC, then username ASC.
	query := `
		SELECT u.id, u.uuid, u.username, u.email, u.created_at, MAX(m.created_at) as last_msg_time
		FROM users u
		LEFT JOIN messages m ON (u.id = m.sender_id AND m.recipient_id = ?) OR (u.id = m.recipient_id AND m.sender_id = ?)
		WHERE u.id != ?
		GROUP BY u.id
		ORDER BY last_msg_time DESC, u.username ASC
	`
	rows, err := DB.Query(query, currentUserID, currentUserID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		var lastMsgTime sql.NullTime // We just need to scan it to skip it, or could add it to a struct wrapper
		// Assuming User model has fields matching the scan order minus last_msg_time which is extra
		// actually we need to match the scan exactly.
		// User struct: ID, UUID, Username, Email, PasswordHash (not selected), CreatedAt
		if err := rows.Scan(&user.ID, &user.UUID, &user.Username, &user.Email, &user.CreatedAt, &lastMsgTime); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}
