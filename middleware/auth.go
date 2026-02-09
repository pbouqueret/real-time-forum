package middleware

import (
	"context"
	"net/http"
	"real-time-forum/database"
	"time"
)

type contextKey string

const UserIDKey contextKey = "userID"

// AuthMiddleware checks for a valid session cookie
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			http.Error(w, "Bad Request", http.StatusBadRequest)
			return
		}

		sessionToken := cookie.Value
		session, err := database.GetSessionByToken(sessionToken)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if session.ExpiresAt.Before(time.Now()) {
			database.DeleteSessionByToken(sessionToken)
			http.Error(w, "Session expired", http.StatusUnauthorized)
			return
		}

		// Add user ID to context
		ctx := context.WithValue(r.Context(), UserIDKey, session.UserID)
		next(w, r.WithContext(ctx))
	}
}
