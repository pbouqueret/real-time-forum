package database

import (
	"real-time-forum/models"
)

// CreateComment inserts a new comment
func CreateComment(comment *models.Comment) error {
	stmt, err := DB.Prepare("INSERT INTO comments(user_id, post_id, content) VALUES(?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(comment.UserID, comment.PostID, comment.Content)
	if err != nil {
		return err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	comment.ID = id
	return nil
}

// GetCommentsByPostID retrieves all comments for a post
func GetCommentsByPostID(postID int64) ([]models.CommentWithAuthor, error) {
	rows, err := DB.Query(`SELECT c.id, c.user_id, c.post_id, c.content, c.created_at, u.username
		FROM comments c JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ? ORDER BY c.created_at ASC`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.CommentWithAuthor
	for rows.Next() {
		var c models.CommentWithAuthor
		err := rows.Scan(&c.ID, &c.UserID, &c.PostID, &c.Content, &c.CreatedAt, &c.Author)
		if err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, nil
}
