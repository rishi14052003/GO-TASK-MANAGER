package services

import (
	"database/sql"
	"fmt"
	"time"

	"task-manager-server/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db        *sql.DB
	jwtSecret []byte
}

func NewAuthService(db *sql.DB) *AuthService {
	return &AuthService{
		db:        db,
		jwtSecret: []byte("your-secret-key-change-in-production"),
	}
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.User, error) {
	// Check if email already exists
	var exists int
	if err := s.db.QueryRow(
		"SELECT 1 FROM users WHERE email = ? LIMIT 1",
		req.Email,
	).Scan(&exists); err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if exists == 1 {
		return nil, fmt.Errorf("email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()

	res, err := s.db.Exec(
		"INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)",
		req.Name,
		req.Email,
		string(hashedPassword),
		now,
	)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	user := models.User{
		ID:        int(id),
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		CreatedAt: now,
	}

	return &user, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	var user models.User

	// Fetch user by email
	err := s.db.QueryRow(
		"SELECT id, name, email, password, created_at FROM users WHERE email = ? LIMIT 1",
		req.Email,
	).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Password,
		&user.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invalid email")
	}
	if err != nil {
		return nil, err
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		// Keep the same message so frontend still shows "invalid email"
		return nil, fmt.Errorf("invalid email")
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"name":    user.Name,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		User:  user,
		Token: tokenString,
	}, nil
}
