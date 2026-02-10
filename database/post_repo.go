package database

import (
	"database/sql"
	"real-time-forum/models"
)

// CreatePost inserts a new post
func CreatePost(post *models.Post) error {
	stmt, err := DB.Prepare("INSERT INTO posts(user_id, category, title, content) VALUES(?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(post.UserID, post.Category, post.Title, post.Content)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	post.ID = id
	return nil
}

// GetPosts retrieves posts, optionally filtered by category
func GetPosts(category string) ([]models.PostWithAuthor, error) {
	query := `SELECT p.id, p.user_id, p.category, p.title, p.content, p.created_at, u.username
		FROM posts p JOIN users u ON p.user_id = u.id`
	args := []interface{}{}

	if category != "" {
		query += " WHERE p.category = ?"
		args = append(args, category)
	}
	query += " ORDER BY p.created_at DESC"

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostWithAuthor
	for rows.Next() {
		var p models.PostWithAuthor
		err := rows.Scan(&p.ID, &p.UserID, &p.Category, &p.Title, &p.Content, &p.CreatedAt, &p.Author)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, nil
}

// GetPostByID retrieves a single post by ID
func GetPostByID(id int64) (*models.PostWithAuthor, error) {
	p := &models.PostWithAuthor{}
	row := DB.QueryRow(`SELECT p.id, p.user_id, p.category, p.title, p.content, p.created_at, u.username
		FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`, id)

	err := row.Scan(&p.ID, &p.UserID, &p.Category, &p.Title, &p.Content, &p.CreatedAt, &p.Author)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return p, nil
}

// GetCategories retrieves all distinct categories
func GetCategories() ([]string, error) {
	rows, err := DB.Query("SELECT DISTINCT category FROM posts ORDER BY category")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, nil
}
