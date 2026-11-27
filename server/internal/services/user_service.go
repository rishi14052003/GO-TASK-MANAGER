package services

import (
	"database/sql"
	"errors"
	"strings"
	"unicode/utf8"

	"github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"

	"task-manager-server/internal/models"
)

var (
	ErrEmptyName       = errors.New("Name cannot be empty")
	ErrCurrentPassword = errors.New("Current password is incorrect")
	ErrShortPassword   = errors.New("Password must be at least 6 characters")
)

type UserService struct{ db *sql.DB }

func NewUserService(db *sql.DB) *UserService { return &UserService{db: db} }

func (s *UserService) GetProfile(userID int) (*models.User, error) {
	var user models.User
	err := s.db.QueryRow("SELECT id, name, email, created_at, is_admin FROM users WHERE id = ?", userID).
		Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt, &user.IsAdmin)
	// Login also supports deployments that predate the is_admin column.
	var dbErr *mysql.MySQLError
	if errors.As(err, &dbErr) && dbErr.Number == 1054 {
		err = s.db.QueryRow("SELECT id, name, email, created_at FROM users WHERE id = ?", userID).
			Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) UpdateProfile(userID int, name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return ErrEmptyName
	}
	_, err := s.db.Exec("UPDATE users SET name = ? WHERE id = ?", name, userID)
	return err
}

func (s *UserService) ChangePassword(userID int, currentPassword, newPassword string) error {
	var previousHash string
	if err := s.db.QueryRow("SELECT password FROM users WHERE id = ?", userID).Scan(&previousHash); err != nil {
		return err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(previousHash), []byte(currentPassword)); err != nil {
		return ErrCurrentPassword
	}
	if utf8.RuneCountInString(newPassword) < 6 {
		return ErrShortPassword
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// A concurrent password change invalidates the hash we just verified.
	result, err := s.db.Exec("UPDATE users SET password = ? WHERE id = ? AND BINARY password = ?", string(hash), userID, previousHash)
	if err != nil {
		return err
	}
	changed, err := result.RowsAffected()
	if err == nil && changed == 0 {
		return ErrCurrentPassword
	}
	return err
}
