# GoTask Pro - Task Management System

A modern, full-stack task management application built with Go backend and React frontend. Features secure user authentication, real-time task management, and complete data isolation between users.

## ✨ Features

### 🔐 Authentication & Security
- **Secure User Registration** with email validation
- **JWT-based Authentication** with 24-hour token expiry
- **Password Hashing** using bcrypt
- **Protected API Routes** with middleware
- **CORS Protection** for cross-origin requests
- **Input Validation** and SQL injection protection

### 📋 Task Management
- **CRUD Operations** - Create, read, update, delete tasks
- **User Data Isolation** - Each user sees only their tasks
- **Task Status Tracking** - Mark tasks as completed/pending
- **Timestamp Management** - Track creation and update times
- **Real-time Updates** - Instant task list updates

### 🎨 User Experience
- **Modern UI** with Tailwind CSS
- **Responsive Design** - Works on all devices
- **TypeScript Support** for type safety
- **Smooth Transitions** and micro-interactions
- **Professional Dark Theme**

## 🏗️ Architecture

```
task-manager/
├── server/                     # Go Backend API
│   ├── cmd/
│   │   └── main.go            # Application entry point
│   ├── internal/
│   │   ├── config/            # Database configuration
│   │   ├── models/            # Data models (User, Task)
│   │   ├── services/          # Business logic layer
│   │   ├── handlers/          # HTTP request handlers
│   │   ├── middleware/        # Authentication & CORS
│   │   └── routes/            # Route definitions
│   ├── go.mod                 # Go dependencies
│   └── go.sum                 # Dependency checksums
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   ├── context/           # React context (Auth)
│   │   └── types/             # TypeScript type definitions
│   ├── public/                # Static assets
│   └── package.json           # Node.js dependencies
└── README.md                  # This file
```

## 🛠️ Tech Stack

### Backend
- **Go 1.25+** - High-performance programming language
- **MySQL** - Relational database for data persistence
- **JWT (golang-jwt/jwt/v5)** - Authentication tokens
- **bcrypt** - Secure password hashing
- **gorilla/mux** - HTTP router and middleware

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Enhanced JavaScript with types
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

## 🚀 Quick Start

### Prerequisites
- **Go 1.25+** - [Install Go](https://golang.org/doc/install)
- **Node.js 18+** - [Install Node.js](https://nodejs.org/)
- **MySQL 8.0+** - [Install MySQL](https://dev.mysql.com/downloads/)

### Database Setup

1. **Create Database:**
   ```sql
   CREATE DATABASE task_manager;
   ```

2. **Create Tables:**
   ```sql
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
       completed TINYINT(1) DEFAULT 0,
       user_id INT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install Go dependencies:**
   ```bash
   go mod tidy
   ```

3. **Set environment variables (optional):**
   ```bash
   export DB_HOST="localhost:3306"
   export DB_USER="root"
   export DB_PASS="your_password"
   export DB_NAME="task_manager"
   ```

4. **Start the server:**
   ```bash
   go run cmd/main.go
   ```

   Server will run on: `http://localhost:8080`

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will run on: `http://localhost:5173`

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### User Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-02-27T16:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Task Endpoints (Protected)

All task endpoints require `Authorization: Bearer {token}` header.

#### Get User Tasks
```http
GET /api/tasks
Authorization: Bearer {token}
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "done": false
}
```

#### Update Task
```http
PUT /api/tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated task title",
  "description": "Updated description",
  "done": true
}
```

#### Delete Task
```http
DELETE /api/tasks/{id}
Authorization: Bearer {token}
```

## 📊 Data Models

### User Model
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}
```

### Task Model
```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  done: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost:3306` | MySQL server host |
| `DB_USER` | `root` | Database username |
| `DB_PASS` | `""` | Database password |
| `DB_NAME` | `task_manager` | Database name |
| `JWT_SECRET` | `"your-secret-key-change-in-production"` | JWT signing secret |

### Production Deployment

1. **Set strong JWT secret:**
   ```bash
   export JWT_SECRET="your-super-secure-random-secret-key"
   ```

2. **Use environment variables for database:**
   ```bash
   export DB_HOST="your-production-db-host"
   export DB_USER="your-production-user"
   export DB_PASS="your-production-password"
   export DB_NAME="task_manager_prod"
   ```

3. **Build and run:**
   ```bash
   go build -o task-manager cmd/main.go
   ./task-manager
   ```

## 🧪 Testing

### Backend Tests
```bash
cd server
go test ./...
```

### Frontend Tests
```bash
cd client
npm test
```

## 🚀 Deployment

### Docker Deployment (Coming Soon)
```dockerfile
# Dockerfile and docker-compose.yml will be added
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Build backend: `go build -o server cmd/main.go`
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates
5. Configure environment variables

## 🔒 Security Features

- **Password Hashing** - All passwords are hashed using bcrypt
- **JWT Authentication** - Stateless authentication with tokens
- **CORS Protection** - Prevents cross-origin attacks
- **SQL Injection Protection** - Parameterized queries
- **Input Validation** - Request body validation
- **User Data Isolation** - Users can only access their own data

## 📈 Performance

- **Fast API Response** - Go's high-performance HTTP handling
- **Efficient Database Queries** - Optimized SQL with proper indexing
- **Minimal Bundle Size** - Optimized React build with Vite
- **Lazy Loading** - Components loaded on demand

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style
- Follow Go formatting standards: `go fmt ./...`
- Use TypeScript strict mode
- Follow React best practices
- Write meaningful commit messages

## 📝 Roadmap

### Version 2.0 Features
- [ ] **Real-time Updates** with WebSockets
- [ ] **Task Categories** and labels
- [ ] **Due Dates** and reminders
- [ ] **File Attachments** for tasks
- [ ] **Team Collaboration** features
- [ ] **Mobile App** (React Native)
- [ ] **Docker** containerization
- [ ] **CI/CD Pipeline** with GitHub Actions
- [ ] **Advanced Search** and filtering
- [ ] **Data Export** (CSV, PDF)
- [ ] **Email Notifications**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Author:** Rishabh Sharma
- **Email:** rishabh@example.com
- **GitHub:** [@rishi14052003](https://github.com/rishi14052003)
- **Issues:** [Report Issues](https://github.com/rishi14052003/GO-TASK-MANAGER/issues)

## 🙏 Acknowledgments

- **Go Team** - For the amazing programming language
- **React Team** - For the excellent UI framework
- **MySQL Team** - For the reliable database
- **Open Source Community** - For all the wonderful libraries

---

<div align="center">
  <strong>Built with ❤️ using Go, MySQL, and React</strong>
  <br>
  <sub>© 2026 GoTask Pro. All rights reserved.</sub>
</div>
