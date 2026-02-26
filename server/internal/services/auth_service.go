package services

import (
	"fmt"
	"sync"
	"time"

	"task-manager-server/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users     map[int]models.User
	emailMap  map[string]int
	nextID    int
	mu        sync.RWMutex
	jwtSecret []byte
}

func NewAuthService() *AuthService {
	return &AuthService{
		users:     make(map[int]models.User),
		emailMap:  make(map[string]int),
		nextID:    1,
		jwtSecret: []byte("your-secret-key-change-in-production"),
	}
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.emailMap[req.Email]; exists {
		return nil, fmt.Errorf("email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	user := models.User{
		ID:        s.nextID,
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		CreatedAt: now,
		UpdatedAt: now,
	}

	s.users[user.ID] = user
	s.emailMap[user.Email] = user.ID
	s.nextID++

	return &user, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	userID, exists := s.emailMap[req.Email]
	if !exists {
		return nil, fmt.Errorf("invalid email")
	}

	user, exists := s.users[userID]
	if !exists {
		return nil, fmt.Errorf("invalid email")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("invalid email")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"name":    user.Name,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
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
