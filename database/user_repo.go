package database

import (
	"database/sql"
	"real-time-forum/models"
)

// CreateUser inserts a new user into the database
func CreateUser(user *models.User) error {
	stmt, err := DB.Prepare("INSERT INTO users(uuid, username, email, password_hash, age, gender, first_name, last_name) VALUES(?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(user.UUID, user.Username, user.Email, user.PasswordHash, user.Age, user.Gender, user.FirstName, user.LastName)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = id
	return nil
}

// GetUserByID retrieves a user by their ID
func GetUserByID(id int64) (*models.User, error) {
	user := &models.User{}
	row := DB.QueryRow("SELECT id, uuid, username, email, password_hash, created_at FROM users WHERE id = ?", id)

	err := row.Scan(&user.ID, &user.UUID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// GetUserByEmail retrieves a user by their email address
func GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	row := DB.QueryRow("SELECT id, uuid, username, email, password_hash, created_at FROM users WHERE email = ?", email)

	err := row.Scan(&user.ID, &user.UUID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Not found
		}
		return nil, err
	}
	return user, nil
}

// GetUserByUsername retrieves a user by their username
func GetUserByUsername(username string) (*models.User, error) {
	user := &models.User{}
	row := DB.QueryRow("SELECT id, uuid, username, email, password_hash, created_at FROM users WHERE username = ?", username)

	err := row.Scan(&user.ID, &user.UUID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}
