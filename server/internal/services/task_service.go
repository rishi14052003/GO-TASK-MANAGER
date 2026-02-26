package services

import (
	"errors"
	"sync"
	"time"

	"task-manager-server/internal/models"
)

type TaskService struct {
	tasks  map[int]models.Task
	nextID int
	mu     sync.RWMutex
}

func NewTaskService() *TaskService {
	return &TaskService{
		tasks:  make(map[int]models.Task),
		nextID: 1,
	}
}

func (s *TaskService) GetTasks(userID int) ([]models.Task, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var userTasks []models.Task
	for _, task := range s.tasks {
		if task.UserID == userID {
			userTasks = append(userTasks, task)
		}
	}

	return userTasks, nil
}

func (s *TaskService) GetTask(id, userID int) (*models.Task, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, task := range s.tasks {
		if task.ID == id && task.UserID == userID {
			return &task, nil
		}
	}

	return nil, errors.New("task not found")
}

func (s *TaskService) CreateTask(req *models.CreateTaskRequest, userID int) (*models.Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	task := models.Task{
		ID:          s.nextID,
		Title:       req.Title,
		Description: req.Description,
		Done:        req.Done,
		UserID:      userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	s.tasks[task.ID] = task
	s.nextID++

	return &task, nil
}
