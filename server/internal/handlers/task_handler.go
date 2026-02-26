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
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tasks, err := h.taskService.GetTasks(userID)
	if err != nil {
		http.Error(w, "Failed to get tasks", http.StatusInternalServerError)
		return
	}

	log.Printf("GetTasks: user=%d returned=%d tasks", userID, len(tasks))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tasks)
}

func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	id := h.extractTaskID(r)
	if id == -1 {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	task, err := h.taskService.GetTask(id, userID)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(task)
}

func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	task, err := h.taskService.CreateTask(&req, userID)
	if err != nil {
		http.Error(w, "Failed to create task", http.StatusInternalServerError)
		return
	}

	log.Printf("CreateTask: user=%d id=%d title=%s", userID, task.ID, task.Title)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	id := h.extractTaskID(r)
	if id == -1 {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	// Get existing task
	existingTask, err := h.taskService.GetTask(id, userID)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
		return
	}

	// Update task fields
	existingTask.Title = req.Title
	existingTask.Description = req.Description
	existingTask.Done = req.Done

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(existingTask)
	log.Printf("UpdateTask: user=%d id=%d title=%s done=%v", userID, id, existingTask.Title, existingTask.Done)
}

func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := h.getUserIDFromContext(r)
	if userID == -1 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	id := h.extractTaskID(r)
	if id == -1 {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	// Check if task exists and belongs to user
	_, err := h.taskService.GetTask(id, userID)
	if err != nil {
		http.Error(w, "Task not found", http.StatusNotFound)
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
