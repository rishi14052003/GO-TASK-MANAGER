package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"task-manager-server/internal/email"
	"task-manager-server/internal/middleware"
	"task-manager-server/internal/models"
	"task-manager-server/internal/services"
)

type taskMailer interface {
	SendTaskNotification(string, email.TaskEmailData) error
}

type TaskHandler struct {
	taskService  *services.TaskService
	emailService taskMailer
	authService  *services.AuthService
}

func NewTaskHandler(taskService *services.TaskService, mailer taskMailer, auth *services.AuthService) *TaskHandler {
	return &TaskHandler{taskService: taskService, emailService: mailer, authService: auth}
}

func (h *TaskHandler) NotifyDeleted(task *models.Task) {
	h.notify(task, "deleted", nil)
}

func (h *TaskHandler) notify(task *models.Task, action string, changes []email.TaskChange) {
	user, err := h.authService.GetUserByID(task.UserID)
	if err != nil {
		log.Printf("task notification recipient: %v", err)
		return
	}
	err = h.emailService.SendTaskNotification(user.Email, email.TaskEmailData{
		UserName: user.Name, Action: action, TaskTitle: task.Title, TaskDescription: task.Description, Changes: changes,
	})
	if err != nil {
		log.Printf("task notification: %v", err)
	}
}

func taskChanges(old, updated *models.Task) []email.TaskChange {
	var changes []email.TaskChange
	add := func(field, before, after string) {
		if before != after {
			changes = append(changes, email.TaskChange{Field: field, OldValue: before, NewValue: after})
		}
	}
	add("Title", old.Title, updated.Title)
	add("Description", old.Description, updated.Description)
	status := func(done bool) string {
		if done {
			return "Completed"
		}
		return "Pending"
	}
	add("Status", status(old.Done), status(updated.Done))
	add("Priority", old.Priority, updated.Priority)
	date := func(day *time.Time) string {
		if day == nil {
			return "No due date"
		}
		return day.Format(time.DateOnly)
	}
	add("Due date", date(old.DueDate), date(updated.DueDate))
	return changes
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
	log.Printf("CreateTask: user=%d id=%d priority=%s", userID, task.ID, task.Priority)
	go h.notify(task, "created", nil)
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
	before, updated, err := h.taskService.UpdateTask(id, userID, &req)
	if err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}
	log.Printf("UpdateTask: user=%d id=%d done=%v priority=%s", userID, id, updated.Done, updated.Priority)
	go h.notify(updated, "updated", taskChanges(before, updated))
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
	deleted, err := h.taskService.DeleteTask(id, userID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}
	log.Printf("DeleteTask: user=%d id=%d", userID, id)
	go h.NotifyDeleted(deleted)
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
