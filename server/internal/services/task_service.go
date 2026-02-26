package services

import (
	"errors"
	"task-manager-server/internal/models"
	"task-manager-server/internal/repository"
)

type TaskService interface {
	CreateTask(req *models.TaskCreateRequest, userID int) (*models.Task, error)
	GetTasks(userID int) ([]*models.Task, error)
	GetTaskByID(id int, userID int) (*models.Task, error)
	UpdateTask(id int, req *models.TaskUpdateRequest, userID int) (*models.Task, error)
	DeleteTask(id int, userID int) error
}

type taskService struct {
	taskRepo repository.TaskRepository
}

func NewTaskService(taskRepo repository.TaskRepository) TaskService {
	return &taskService{
		taskRepo: taskRepo,
	}
}

func (s *taskService) CreateTask(req *models.TaskCreateRequest, userID int) (*models.Task, error) {
	task := &models.Task{
		Title:       req.Title,
		Description: req.Description,
		UserID:      userID,
		Completed:   false,
	}

	err := s.taskRepo.Create(task)
	if err != nil {
		return nil, err
	}

	return task, nil
}

func (s *taskService) GetTasks(userID int) ([]*models.Task, error) {
	return s.taskRepo.GetByUserID(userID)
}

func (s *taskService) GetTaskByID(id int, userID int) (*models.Task, error) {
	task, err := s.taskRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, errors.New("task not found")
	}
	if task.UserID != userID {
		return nil, errors.New("unauthorized")
	}

	return task, nil
}

func (s *taskService) UpdateTask(id int, req *models.TaskUpdateRequest, userID int) (*models.Task, error) {
	task, err := s.GetTaskByID(id, userID)
	if err != nil {
		return nil, err
	}

	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Completed != nil {
		task.Completed = *req.Completed
	}

	err = s.taskRepo.Update(task)
	if err != nil {
		return nil, err
	}

	return task, nil
}

func (s *taskService) DeleteTask(id int, userID int) error {
	_, err := s.GetTaskByID(id, userID)
	if err != nil {
		return err
	}

	return s.taskRepo.Delete(id)
}