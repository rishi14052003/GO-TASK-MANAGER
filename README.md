# GoTask Pro

A full-stack task management application built with **Go** and **React**. Fast by design — the Go backend delivers sub-2ms API responses with true parallel concurrency via goroutines.

---

## Tech Stack

### Backend
- **Go 1.25+** — high-performance, compiled language
- **MySQL 8.0** — relational database
- **gorilla/mux** — HTTP router
- **golang-jwt/jwt v5** — JWT authentication
- **bcrypt** — password hashing

### Frontend
- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — utility-first styling
- **React Router v6** — client-side routing
- **Lucide React** — icons

---

## Project Structure

```
task-manager/
├── server/                        # Go backend
│   ├── cmd/
│   │   └── main.go               # Entry point
│   ├── internal/
│   │   ├── config/               # DB connection
│   │   ├── handlers/             # HTTP handlers (auth, tasks)
│   │   ├── middleware/           # JWT auth + CORS
│   │   ├── models/               # User, Task structs
│   │   ├── repository/           # DB query layer
│   │   ├── routes/               # Route definitions
│   │   └── services/             # Business logic
│   ├── .env                      # Environment variables
│   ├── go.mod
│   └── go.sum
│
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/           # Navbar, TaskCard, StatsCard
│   │   ├── context/              # AuthContext + constants
│   │   ├── pages/                # Login, Register, Dashboard
│   │   ├── services/             # api.ts (fetch wrapper)
│   │   └── types/                # task.ts, user.ts
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## Database Setup

Open MySQL and run:

```sql
CREATE DATABASE task_manager;
USE task_manager;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    done TINYINT(1) NOT NULL DEFAULT 0,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_tasks_user_id (user_id),
    KEY idx_tasks_done (done),
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Environment Variables

Create `server/.env`:

```env
DB_HOST=localhost:3306
DB_USER=root
DB_PASS=your_password
DB_NAME=task_manager
JWT_SECRET=your-secret-key-change-in-production
```

---

## Running Locally

### Backend
```bash
cd server
go mod tidy
go run cmd/main.go
# → http://localhost:8080
```

### Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login, returns JWT |

**Register body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Login response:**
```json
{
  "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "createdAt": "..." },
  "token": "eyJ..."
}
```

### Tasks (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks for logged-in user |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

**Create task body:**
```json
{
  "title": "Review pull request",
  "description": "Check the UI redesign branch",
  "done": false
}
```

---

## Security

- Passwords hashed with **bcrypt**
- Auth via **JWT** (24hr expiry)
- All task routes protected by auth middleware
- Users can only access their own tasks
- Parameterized SQL queries — no injection risk
- CORS configured for `localhost:5173`

---

## Why Go for the Backend?

| | Node.js | Go |
|---|---|---|
| Requests/sec | ~50k | ~200k+ |
| Memory usage | High | Very low |
| Concurrency | Event loop | Goroutines (true parallel) |
| Deployment | Needs Node runtime | Single compiled binary |
| Startup time | Slow | Instant |

---

## Build for Production

```bash
# Backend — single binary
cd server
go build -o gotaskpro cmd/main.go
./gotaskpro

# Frontend — static files
cd client
npm run build
# output in client/dist/
```

---

## Roadmap

- [ ] Due dates on tasks
- [ ] Priority levels (High / Medium / Low)
- [ ] Task categories / labels
- [ ] WebSocket real-time sync
- [ ] Docker + docker-compose
- [ ] CI/CD with GitHub Actions
- [ ] Email notifications
- [ ] Mobile app (React Native)

---

## Author

**Rishabh Hitesh Jain**
GitHub: [@rishi14052003](https://github.com/rishi14052003)
Issues: [Report here](https://github.com/rishi14052003/GO-TASK-MANAGER/issues)

---

<div align="center">
  <strong>Built with Go, MySQL, and React</strong><br/>
  <sub>© 2026 GoTask Pro</sub>
</div>