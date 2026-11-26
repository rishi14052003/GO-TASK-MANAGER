package services

import (
	"database/sql/driver"
	"errors"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"golang.org/x/crypto/bcrypt"
)

type otpRecorder struct{ to, code string }

func (r *otpRecorder) SendOTP(to, code string) error { r.to, r.code = to, code; return nil }

func TestSendOTPUsesRegisteredAddress(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	recorder := &otpRecorder{}
	const address = "Owner@example.com"
	mock.ExpectBegin()
	mock.ExpectQuery("SELECT email FROM users").WithArgs("owner@example.com").WillReturnRows(sqlmock.NewRows([]string{"email"}).AddRow(address))
	mock.ExpectExec("DELETE FROM otps WHERE email").WithArgs(address).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec("INSERT INTO otps").WithArgs(address, sqlmock.AnyArg()).WillReturnResult(sqlmock.NewResult(42, 1))
	mock.ExpectCommit()
	if err := NewOTPService(db, recorder).SendOTP("owner@example.com"); err != nil {
		t.Fatal(err)
	}
	if recorder.to != address || !regexp.MustCompile(`^[0-9]{6}$`).MatchString(recorder.code) {
		t.Fatal("expected a six-digit code at the registered address")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

type bcryptPassword string

func (p bcryptPassword) Match(value driver.Value) bool {
	hash, ok := value.([]byte)
	return ok && bcrypt.CompareHashAndPassword(hash, []byte(p)) == nil
}

func TestCheckCode(t *testing.T) {
	const email = "owner@example.com"
	for _, tc := range []struct {
		name, code, password string
		attempts             int
		expired              bool
		want                 error
	}{
		{name: "verify keeps code", code: "012345"},
		{name: "wrong reset counts", code: "111111", password: "secret123", want: ErrOTPInvalid},
		{name: "locked code cannot reset", code: "012345", password: "secret123", attempts: 3, want: ErrOTPLocked},
		{name: "expired code removed", code: "012345", expired: true, want: ErrOTPExpired},
		{name: "reset consumes code", code: "012345", password: "secret123"},
		{name: "consumed code cannot reset", code: "012345", password: "secret123", want: ErrOTPMissing},
	} {
		t.Run(tc.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer db.Close()
			mock.ExpectBegin()
			mock.ExpectQuery("SELECT id, email FROM users").WithArgs(email).WillReturnRows(sqlmock.NewRows([]string{"id", "email"}).AddRow(7, email))
			rows := sqlmock.NewRows([]string{"id", "otp", "attempts", "expired"})
			if tc.want != ErrOTPMissing {
				rows.AddRow(42, "012345", tc.attempts, tc.expired)
			}
			mock.ExpectQuery("SELECT id, otp, attempts, .* FOR UPDATE").WithArgs(email).WillReturnRows(rows)
			switch tc.want {
			case ErrOTPLocked, ErrOTPMissing:
				mock.ExpectRollback()
			case ErrOTPInvalid:
				mock.ExpectExec("UPDATE otps SET attempts = attempts").WithArgs(42).WillReturnResult(sqlmock.NewResult(0, 1))
				mock.ExpectCommit()
			default:
				if tc.password != "" {
					mock.ExpectExec("UPDATE users SET password").WithArgs(bcryptPassword(tc.password), 7).WillReturnResult(sqlmock.NewResult(0, 1))
				}
				if tc.expired || tc.password != "" {
					mock.ExpectExec("DELETE FROM otps WHERE id").WithArgs(42).WillReturnResult(sqlmock.NewResult(0, 1))
				}
				mock.ExpectCommit()
			}
			s := NewOTPService(db, nil)
			if tc.password == "" {
				err = s.VerifyOTP(email, tc.code)
			} else {
				err = s.ResetPassword(email, tc.code, tc.password)
			}
			if !errors.Is(err, tc.want) {
				t.Fatalf("got %v, want %v", err, tc.want)
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}
