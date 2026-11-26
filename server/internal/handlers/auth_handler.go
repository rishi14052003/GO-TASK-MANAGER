package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"task-manager-server/internal/models"
	"task-manager-server/internal/services"

	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	authService *services.AuthService
	otpService  *services.OTPService
	taskService *services.TaskService
	jwtSecret   []byte
}

func NewAuthHandler(authService *services.AuthService, taskService *services.TaskService, otpService *services.OTPService, secret []byte) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		otpService:  otpService,
		taskService: taskService,
		jwtSecret:   secret,
	}
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{
		"message": message,
	})
}

func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Email) == "" {
		writeError(w, 400, "A valid email is required")
		return
	}
	if err := h.otpService.SendOTP(strings.TrimSpace(req.Email)); err != nil {
		log.Printf("password reset email: %v", err)
	}
	writeJSON(w, 200, map[string]string{"message": "If that email exists, an OTP has been sent"})
}

func writeOTPResult(w http.ResponseWriter, err error, success string) {
	switch {
	case err == nil:
		writeJSON(w, 200, map[string]string{"message": success})
	case errors.Is(err, services.ErrOTPMissing), errors.Is(err, services.ErrOTPExpired),
		errors.Is(err, services.ErrOTPLocked), errors.Is(err, services.ErrOTPInvalid),
		errors.Is(err, services.ErrPasswordLength):
		writeError(w, 400, err.Error())
	default:
		log.Printf("password reset: %v", err)
		writeError(w, 500, "Unable to process the password reset")
	}
}

func (h *AuthHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req models.VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Email) == "" || req.OTP == "" {
		writeError(w, 400, "Email and OTP are required")
		return
	}
	writeOTPResult(w, h.otpService.VerifyOTP(strings.TrimSpace(req.Email), req.OTP), "OTP verified")
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req models.ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Email) == "" || req.OTP == "" {
		writeError(w, 400, "Email and OTP are required")
		return
	}
	writeOTPResult(w, h.otpService.ResetPassword(strings.TrimSpace(req.Email), req.OTP, req.NewPassword), "Password reset successfully")
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.authService.Register(&req)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	log.Printf("Register: created user=%d", user.ID)
	writeJSON(w, http.StatusCreated, user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	response, err := h.authService.Login(&req)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}

	log.Printf("Login: user=%d", response.User.ID)
	writeJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	authHeader := r.Header.Get("Authorization")
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return h.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		writeError(w, http.StatusUnauthorized, "Invalid token")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Invalid token claims")
		return
	}

	userID := int(claims["user_id"].(float64))

	tasks, err := h.taskService.GetTasks(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get tasks")
		return
	}

	writeJSON(w, http.StatusOK, tasks)
}

func (h *AuthHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	authHeader := r.Header.Get("Authorization")
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return h.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		writeError(w, http.StatusUnauthorized, "Invalid token")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Invalid token claims")
		return
	}

	userID := int(claims["user_id"].(float64))

	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "Title is required")
		return
	}

	task, err := h.taskService.CreateTask(&req, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create task")
		return
	}

	writeJSON(w, http.StatusCreated, task)
}
