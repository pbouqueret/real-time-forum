package database

import (
	"real-time-forum/models"
	"time"
)

// CreateSession inserts a new session
func CreateSession(session *models.Session) error {
	stmt, err := DB.Prepare("INSERT INTO sessions(user_id, token, expires_at) VALUES(?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(session.UserID, session.Token, session.ExpiresAt)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	session.ID = id
	return nil
}

// GetSessionByToken retrieves a session by its token
func GetSessionByToken(token string) (*models.Session, error) {
	session := &models.Session{}
	row := DB.QueryRow("SELECT id, user_id, token, expires_at FROM sessions WHERE token = ?", token)

	err := row.Scan(&session.ID, &session.UserID, &session.Token, &session.ExpiresAt)
	if err != nil {
		return nil, err
	}
	return session, nil
}

// DeleteSessionByToken removes a session
func DeleteSessionByToken(token string) error {
	stmt, err := DB.Prepare("DELETE FROM sessions WHERE token = ?")
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(token)
	return err
}

// CleanupSessions removes expired sessions
func CleanupSessions() error {
	_, err := DB.Exec("DELETE FROM sessions WHERE expires_at < ?", time.Now())
	return err
}
