package services

import (
	"crypto/rand"
	"crypto/subtle"
	"database/sql"
	"errors"
	"fmt"
	"math/big"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrOTPMissing     = errors.New("OTP not found, please request a new one")
	ErrOTPExpired     = errors.New("OTP has expired, please request a new one")
	ErrOTPLocked      = errors.New("Too many failed attempts, please request a new OTP")
	ErrOTPInvalid     = errors.New("Invalid OTP")
	ErrPasswordLength = errors.New("Use at least 6 characters and at most 72 bytes for your password")
)

type OTPSender interface{ SendOTP(to, otp string) error }
type OTPService struct {
	db     *sql.DB
	sender OTPSender
}

func NewOTPService(db *sql.DB, sender OTPSender) *OTPService {
	return &OTPService{db: db, sender: sender}
}

func GenerateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n), nil
}

func (s *OTPService) SendOTP(email string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var recipient string
	err = tx.QueryRow("SELECT email FROM users WHERE email = ? FOR UPDATE", email).Scan(&recipient)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	code, err := GenerateOTP()
	if err != nil {
		return err
	}
	if _, err = tx.Exec("DELETE FROM otps WHERE email = ?", recipient); err != nil {
		return err
	}
	result, err := tx.Exec("INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, CURRENT_TIMESTAMP + INTERVAL 10 MINUTE)", recipient, code)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	if err = tx.Commit(); err != nil {
		return err
	}
	// MySQL may match email aliases under its collation. Always send to the stored address.
	if err = s.sender.SendOTP(recipient, code); err != nil {
		_, cleanupErr := s.db.Exec("DELETE FROM otps WHERE id = ?", id)
		return errors.Join(err, cleanupErr)
	}
	return nil
}

func (s *OTPService) VerifyOTP(email, code string) error {
	return s.checkCode(email, code, "")
}

func (s *OTPService) ResetPassword(email, code, password string) error {
	if utf8.RuneCountInString(password) < 6 || len(password) > 72 {
		return ErrPasswordLength
	}
	return s.checkCode(email, code, password)
}

// Verification retains a valid code. Reset consumes it in the password update transaction.
func (s *OTPService) checkCode(email, code, password string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var uid int
	var recipient string
	if err := tx.QueryRow("SELECT id, email FROM users WHERE email = ? FOR UPDATE", email).Scan(&uid, &recipient); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrOTPMissing
		}
		return err
	}
	var id, attempts int
	var stored string
	var expired bool
	err = tx.QueryRow("SELECT id, otp, attempts, expires_at <= CURRENT_TIMESTAMP FROM otps WHERE email = ? ORDER BY id DESC LIMIT 1 FOR UPDATE", recipient).Scan(&id, &stored, &attempts, &expired)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrOTPMissing
	}
	if err != nil {
		return err
	}

	var rejection error
	switch {
	case expired:
		_, err = tx.Exec("DELETE FROM otps WHERE id = ?", id)
		rejection = ErrOTPExpired
	case attempts >= 3:
		return ErrOTPLocked
	case subtle.ConstantTimeCompare([]byte(code), []byte(stored)) != 1:
		_, err = tx.Exec("UPDATE otps SET attempts = attempts + 1 WHERE id = ?", id)
		rejection = ErrOTPInvalid
	case password != "":
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		if _, err = tx.Exec("UPDATE users SET password = ? WHERE id = ?", hash, uid); err != nil {
			return err
		}
		if _, err = tx.Exec("DELETE FROM otps WHERE id = ?", id); err != nil {
			return err
		}
	}
	if err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	return rejection
}
