package services

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/go-sql-driver/mysql"
	"time"

	"task-manager-server/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db        *sql.DB
	jwtSecret []byte
}

func NewAuthService(db *sql.DB, secret []byte) *AuthService {
	return &AuthService{
		db:        db,
		jwtSecret: secret,
	}
}

func (s *AuthService) GetUserByID(id int) (*models.User, error) {
	var user models.User
	err := s.db.QueryRow("SELECT id, name, email FROM users WHERE id = ?", id).Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.User, error) {
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

	scan := func(query string) error {
		return s.db.QueryRow(query, req.Email).Scan(&user.ID, &user.Name, &user.Email,
			&user.Password, &user.CreatedAt, &user.IsAdmin)
	}
	err := scan("SELECT id, name, email, password, created_at, is_admin FROM users WHERE email = ? LIMIT 1")
	// Ordinary accounts can still sign in while the role migration is rolling out.
	var dbErr *mysql.MySQLError
	if errors.As(err, &dbErr) && dbErr.Number == 1054 {
		err = scan("SELECT id, name, email, password, created_at, FALSE FROM users WHERE email = ? LIMIT 1")
	}
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invalid email")
	}
	if err != nil {
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		// Keep the same message so frontend still shows "invalid email"
		return nil, fmt.Errorf("invalid email")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"is_admin": user.IsAdmin,
		"email":    user.Email,
		"name":     user.Name,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
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
