# Scénario de Démo — Soutenance Real-Time Forum

## Préparation avant la démo
```bash
rm -f forum.db                    # Base fraîche
go run seed.go                    # Seed les données de démo
go run main.go                    # Lancer le serveur
```
Ouvrir 2 navigateurs côte à côte : **Chrome** (Alice) + **Firefox** (Bob)

---

## 1. Introduction (2 min)
- Présenter l'équipe (DEV A + DEV B)
- "Forum web temps réel en SPA, construit from scratch"
- Stack : Go, SQLite, WebSocket, Vanilla JS
- "Aucun framework utilisé, tout est fait maison"

---

## 2. Architecture (3 min)
Montrer un schéma (tableau/slide) :
```
Browser (JS SPA) <--HTTP REST--> Go Server <--> SQLite
                  <--WebSocket-->
```
Points clés à mentionner :
- **SPA** : un seul fichier HTML, routage côté client en hash
- **API REST** : CRUD posts/comments, auth avec cookies HttpOnly
- **WebSocket** : chat privé temps réel, statut online/offline
- **Hub pattern** : goroutine dédiée avec channels pour gérer les connexions

---

## 3. Démo Live (10 min)

### Étape 1 — Inscription (Chrome)
1. Aller sur `http://localhost:8080`
2. Montrer la **redirection automatique** vers login (route guard)
3. Cliquer "Register"
4. Créer un compte `demo` / `demo@test.com` / `password123`
5. Montrer le **toast vert** "Account created!"
6. Montrer la redirection vers login

### Étape 2 — Connexion (Chrome = Alice, Firefox = Bob)
1. **Chrome** : Se connecter avec `alice` / `password123`
2. Montrer la **navbar** avec username + bouton logout
3. **Firefox** : Se connecter avec `bob` / `password123`

### Étape 3 — Forum / Posts
1. **Chrome (Alice)** : Montrer le feed avec les posts existants
2. Montrer les **filtres par catégorie** (Technology, Help, etc.)
3. Créer un nouveau post :
   - Titre : "Live demo post"
   - Contenu : "This post was created during our presentation"
   - Catégorie : General
4. Montrer le post qui apparaît dans le feed
5. Cliquer "Read more" → page détail

### Étape 4 — Commentaires
1. **Chrome (Alice)** : Ajouter un commentaire sur le post
2. **Firefox (Bob)** : Naviguer vers le même post, voir le commentaire
3. Bob ajoute un commentaire aussi
4. Montrer les commentaires triés par date

### Étape 5 — Chat Privé (POINT FORT)
1. **Chrome (Alice)** : Cliquer "Chat" dans la navbar
2. Montrer la **liste des users** avec Bob en ligne (point vert)
3. Cliquer sur Bob → les anciens messages s'affichent
4. **Alice envoie** : "Salut Bob, tu vois ce message en direct ?"
5. **Firefox (Bob)** : Aller sur Chat → le message apparaît **instantanément**
6. **Bob répond** : "Oui, en temps réel !"
7. Montrer les **bulles colorées** (rouge = envoyé, gris = reçu)

### Étape 6 — Online/Offline
1. **Firefox (Bob)** : Cliquer Logout
2. **Chrome (Alice)** : Montrer que Bob passe **offline** (point gris) en temps réel
3. **Firefox** : Bob se reconnecte → point repasse vert

### Étape 7 — Infinite Scroll (si le temps le permet)
1. Montrer que les messages chargent par 10
2. Scroller vers le haut → chargement des anciens messages

---

## 4. Challenges Techniques (3 min)

### Challenge 1 — SPA sans framework
- **Problème** : Pas de React/Vue, tout en Vanilla JS
- **Solution** : Routeur hash-based, import() dynamique, state global dans app.js

### Challenge 2 — WebSocket multiplexé
- **Problème** : Un seul WS par client, plusieurs types de messages
- **Solution** : Messages JSON typés `{type, payload, sender_id, recipient_id}` + dispatcher

### Challenge 3 — Concurrence Go
- **Problème** : Map des connexions accédée par plusieurs goroutines
- **Solution** : Pattern Hub avec goroutine dédiée + channels (register/unregister/broadcast)

### Challenge 4 — Auth sur WebSocket
- **Problème** : Vérifier l'identité à l'upgrade WS
- **Solution** : Lecture du cookie session_token lors du handshake, vérification en BDD

### Challenge 5 — Pagination infinie
- **Problème** : Charger les messages sans spam au scroll
- **Solution** : Throttle 200ms + flags loading/noMoreMessages + OFFSET SQL

---

## 5. Organisation (2 min)
- Méthode Agile, 4 sprints
- Git flow : `main` ← `develop` ← `feature/*`
- 6 PRs avec code review croisée
- Convention de commits : `type(scope): description`
- DEV A = Backend, WS, BDD | DEV B = Frontend, SPA, CSS, UX

---

## 6. Questions du jury (5 min)
Chaque membre doit pouvoir expliquer le code de l'autre.

### Questions probables et réponses courtes :
- **"Pourquoi pas de framework ?"** → Contrainte du projet, mais on a prouvé qu'on maîtrise les concepts sous-jacents
- **"Comment gérez-vous la sécurité ?"** → bcrypt, cookies HttpOnly, requêtes SQL paramétrées, escapeHtml côté JS
- **"Que se passe-t-il si le serveur redémarre ?"** → Les sessions en BDD persistent, le WS se reconnecte automatiquement après 3s
- **"Comment scaleriez-vous ?"** → Mutex/RWMutex sur le Hub, possible migration vers Redis pour le pub/sub multi-instances

---

## Comptes de démo
| Username | Password |
|----------|----------|
| alice | password123 |
| bob | password123 |
| charlie | password123 |
