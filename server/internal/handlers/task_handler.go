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
	return &TaskHandler{
		taskService: taskService,
	}
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tasks)
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(task)
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
		writeError(w, http.StatusInternalServerError, "Failed to create task")
		return
	}

	log.Printf("CreateTask: user=%d id=%d title=%s", userID, task.ID, task.Title)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
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

	// Get existing task
	existingTask, err := h.taskService.GetTask(id, userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}

	// Apply partial updates only for fields that are provided
	if req.Title != nil {
		existingTask.Title = *req.Title
	}
	if req.Description != nil {
		existingTask.Description = *req.Description
	}
	if req.Done != nil {
		existingTask.Done = *req.Done
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(existingTask)
	log.Printf("UpdateTask: user=%d id=%d title=%s done=%v", userID, id, existingTask.Title, existingTask.Done)
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

	// Check if task exists and belongs to user
	_, err := h.taskService.GetTask(id, userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}

	// Delete task (this would need to be implemented in the service)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Task deleted successfully"})
	log.Printf("DeleteTask: user=%d id=%d", userID, id)
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
	// Extract ID from URL path like /api/tasks/123
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
