# Real-Time Forum

A Single Page Application (SPA) forum built with Go and Vanilla JavaScript, featuring real-time capabilities via WebSockets.

## Stack Technique

- **Backend**: Go (Golang)
- **Database**: SQLite3 (using `database/sql` only, no ORM)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (No frameworks)
- **Communication**: REST API & WebSockets (`github.com/gorilla/websocket`)
- **Security**: HttpOnly Cookies, UUID Sessions, bcrypt passwords

## Architecture des Dossiers

### Backend
- `handlers/`: HTTP request handlers (controllers)
- `websocket/`: WebSocket connection management
- `models/`: Go structs representing database entities
- `database/`: Database connection and SQL migrations
- `middleware/`: HTTP middleware (auth, logging)
- `utils/`: Common utility functions
- `main.go`: Entry point for the server

### Frontend (`static/`)
- `index.html`: Main HTML file (SPA entry point)
- `css/`: Stylesheets (`style.css`)
- `js/`: Application logic
  - `pages/`: Page-specific logic (e.g., login, home, post view)
  - `utils/`: Helper functions

## API Endpoints

### Authentication (`handlers/auth.go`)
- `POST /api/register` : Create a new account
  - Body: `{ "username": "...", "email": "...", "password": "..." }`
- `POST /api/login` : Login and create session
  - Body: `{ "identifier": "...", "password": "..." }`
- `POST /api/logout` : Logout and destroy session
- `GET /api/me` : Get current user details

### Posts & Comments (`handlers/posts.go`, `handlers/comments.go`)
- `GET /api/posts?category=...` : List posts (optional category filter)
- `POST /api/posts` : Create a post
  - Body: `{ "title": "...", "content": "...", "category": "..." }`
- `GET /api/posts/{id}` : Get post details
- `GET /api/posts/{id}/comments` : Get comments for a post
- `POST /api/posts/{id}/comments` : Add a comment
  - Body: `{ "content": "..." }`
- `GET /api/categories` : Get all categories

### Chat (`handlers/chat.go`)
- `GET /api/chat/users` : Get list of users sorted by last interaction (online status via WS)
- `GET /api/chat/messages?user_id={id}&limit={n}&offset={n}` : Get message history with a specific user

## WebSocket Protocol

Endpoint: `/ws`

### Message Types
- `private_message`: Send/Receive a private message.
  - Payload: String content (when sending)
- `user_online`: Notification that a user has connected.
- `user_offline`: Notification that a user has disconnected.
- `broadcast`: General broadcast (not used for chat).

## Instructions pour Lancer le Projet

1.  **Prérequis**: Go installé (version 1.20+ recommandée).
2.  **Initialisation**:
    ```bash
    go mod download
    ```
3.  **Lancement du Serveur**:
    ```bash
    go run main.go
    ```
4.  **Accès**: Ouvrir `http://localhost:8080` dans le navigateur.

## Développement

Le projet suit la convention **Conventional Commits**.

- `feat(scope): ...` pour les nouvelles fonctionnalités
- `fix(scope): ...` pour les corrections de bugs
- `chore(scope): ...` pour les tâches de maintenance

Branche principale de développement : `develop`.
