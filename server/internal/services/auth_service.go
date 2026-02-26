package services

import (
	"errors"
	"time"

	"task-manager-server/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (s *AuthService) Register(req *models.UserRegisterRequest) (*models.UserResponse, error) {
	// In a real app, you'd check if user exists and save to database
	// For now, just return a mock user
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		ID:       1,
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	return &models.UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	}, nil
}

func (s *AuthService) Login(req *models.UserLoginRequest) (*models.LoginResponse, error) {
	// In a real app, you'd verify credentials against database
	// For now, just return a mock token
	if req.Username == "" || req.Password == "" {
		return nil, errors.New("invalid credentials")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  1,
		"username": req.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		return nil, err
	}

	return &models.LoginResponse{
		Token: tokenString,
		User: models.UserResponse{
			ID:       1,
			Username: req.Username,
			Email:    req.Username + "@example.com",
		},
	}, nil
}
