package handlers

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"task-manager-server/internal/services"
)

type AdminHandler struct{ service *services.AdminService }

func NewAdminHandler(service *services.AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

func (h *AdminHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetStats(r.Context())
	if err != nil {
		writeError(w, 500, "Unable to load statistics")
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.GetAllUsers(r.Context())
	if err != nil {
		writeError(w, 500, "Unable to load users")
		return
	}
	writeJSON(w, http.StatusOK, users)
}

func (h *AdminHandler) GetAllTasks(w http.ResponseWriter, r *http.Request) {
	tasks, err := h.service.GetAllTasks(r.Context())
	if err != nil {
		writeError(w, 500, "Unable to load tasks")
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	deleteAdminResource(w, r, h.service.DeleteUser)
}

func (h *AdminHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	deleteAdminResource(w, r, h.service.DeleteTask)
}

func deleteAdminResource(w http.ResponseWriter, r *http.Request, remove func(context.Context, int) error) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := remove(r.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Record not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "Unable to delete record")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
