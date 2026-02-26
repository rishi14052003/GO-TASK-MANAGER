package services

import (
	"errors"
	"sync"

	"task-manager-server/internal/models"
)

type TaskService struct {
	tasks []models.Task
	mu    sync.RWMutex
}

func NewTaskService() *TaskService {
	return &TaskService{
		tasks: []models.Task{
			{ID: 1, Title: "Sample Task 1", Description: "This is a sample task", Done: false, UserID: 1},
			{ID: 2, Title: "Sample Task 2", Description: "Another sample task", Done: true, UserID: 1},
		},
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

func (s *TaskService) CreateTask(req *models.TaskCreateRequest, userID int) (*models.Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	newTask := models.Task{
		ID:          len(s.tasks) + 1,
		Title:       req.Title,
		Description: req.Description,
		Done:        false,
		UserID:      userID,
	}

	s.tasks = append(s.tasks, newTask)
	return &newTask, nil
}

func (s *TaskService) UpdateTask(id int, req *models.TaskUpdateRequest, userID int) (*models.Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, task := range s.tasks {
		if task.ID == id && task.UserID == userID {
			if req.Title != nil {
				s.tasks[i].Title = *req.Title
			}
			if req.Description != nil {
				s.tasks[i].Description = *req.Description
			}
			if req.Done != nil {
				s.tasks[i].Done = *req.Done
			}
			return &s.tasks[i], nil
		}
	}

	return nil, errors.New("task not found")
}

func (s *TaskService) DeleteTask(id, userID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, task := range s.tasks {
		if task.ID == id && task.UserID == userID {
			s.tasks = append(s.tasks[:i], s.tasks[i+1:]...)
			return nil
		}
	}

	return errors.New("task not found")
}
