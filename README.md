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
- `middleware/`: HTTP middleware (auth, logging, etc.)
- `utils/`: Common utility functions
- `main.go`: Entry point for the server

### Frontend (`static/`)
- `index.html`: Main HTML file (SPA entry point)
- `css/`: Stylesheets (`style.css`)
- `js/`: Application logic
  - `pages/`: Page-specific logic (e.g., login, home, post view)
  - `utils/`: Helper functions

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
