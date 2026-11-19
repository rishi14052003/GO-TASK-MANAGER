package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"task-manager-server/internal/middleware"
	"task-manager-server/internal/models"
	"task-manager-server/internal/services"
)

type TaskHandler struct {
	taskService *services.TaskService
}

func NewTaskHandler(taskService *services.TaskService) *TaskHandler {
	return &TaskHandler{taskService: taskService}
}

func (h *TaskHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	tasks, err := h.taskService.GetTasks(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get tasks")
		return
	}
	log.Printf("GetTasks: user=%d returned=%d tasks", userID, len(tasks))
	writeJSON(w, http.StatusOK, tasks)
}

func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	id := h.extractTaskID(r)
	if id == -1 {
		writeError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}
	task, err := h.taskService.GetTask(id, userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}
	writeJSON(w, http.StatusOK, task)
}

func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
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
		log.Printf("CreateTask error: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to create task")
		return
	}
	log.Printf("CreateTask: user=%d id=%d title=%s priority=%s", userID, task.ID, task.Title, task.Priority)
	writeJSON(w, http.StatusCreated, task)
}

func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	id := h.extractTaskID(r)
	if id == -1 {
		writeError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}
	var req models.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	updated, err := h.taskService.UpdateTask(id, userID, &req)
	if err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}
	log.Printf("UpdateTask: user=%d id=%d title=%s done=%v priority=%s", userID, id, updated.Title, updated.Done, updated.Priority)
	writeJSON(w, http.StatusOK, updated)
}

func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	id := h.extractTaskID(r)
	if id == -1 {
		writeError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}
	if err := h.taskService.DeleteTask(id, userID); err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}
	log.Printf("DeleteTask: user=%d id=%d", userID, id)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Task deleted successfully"})
}

func (h *TaskHandler) getUserIDFromContext(r *http.Request) int {
	userID := r.Context().Value(middleware.UserIDKey)
	if userID == nil {
		return -1
	}
	id, ok := userID.(int)
	if !ok {
		return -1
	}
	return id
}

func (h *TaskHandler) extractTaskID(r *http.Request) int {
	path := strings.TrimPrefix(r.URL.Path, "/api/tasks/")
	path = strings.TrimSuffix(path, "/")
	if path == "" {
		return -1
	}
	id, err := strconv.Atoi(path)
	if err != nil {
		return -1
	}
	return id
}
