package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"task-manager-server/internal/middleware"
	"task-manager-server/internal/models"
	"task-manager-server/internal/services"
)

type UserHandler struct{ userService *services.UserService }

func NewUserHandler(service *services.UserService) *UserHandler {
	return &UserHandler{userService: service}
}

func writeProfileError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, sql.ErrNoRows):
		writeError(w, http.StatusNotFound, "User not found")
	case errors.Is(err, services.ErrEmptyName), errors.Is(err, services.ErrCurrentPassword), errors.Is(err, services.ErrShortPassword):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, bcrypt.ErrPasswordTooLong):
		writeError(w, http.StatusBadRequest, "Password must be at most 72 bytes")
	default:
		writeError(w, http.StatusInternalServerError, "Unable to access account settings")
	}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	user, err := h.userService.GetProfile(userID)
	if err != nil {
		writeProfileError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if err := h.userService.UpdateProfile(userID, req.Name); err != nil {
		writeProfileError(w, err)
		return
	}
	h.GetProfile(w, r)
}

func (h *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if err := h.userService.ChangePassword(userID, req.CurrentPassword, req.NewPassword); err != nil {
		writeProfileError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Password changed successfully"})
}
