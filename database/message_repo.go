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
		SELECT m.id, m.sender_id, m.recipient_id, u.username, m.content, m.created_at, m.is_read
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
		ORDER BY m.created_at DESC
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
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.RecipientID, &msg.SenderUsername, &msg.Content, &msg.CreatedAt, &msg.IsRead); err != nil {
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
		SELECT u.id, u.uuid, u.username, u.age, u.gender, u.first_name, u.last_name, u.email, u.created_at, MAX(m.created_at) as last_msg_time
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
		var lastMsgTime sql.NullTime
		if err := rows.Scan(&user.ID, &user.UUID, &user.Username, &user.Age, &user.Gender, &user.FirstName, &user.LastName, &user.Email, &user.CreatedAt, &lastMsgTime); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}
