package services

import (
	"database/sql"
	"errors"
	"time"

	"task-manager-server/internal/models"
)

type TaskService struct {
	db *sql.DB
}

func NewTaskService(db *sql.DB) *TaskService {
	return &TaskService{
		db: db,
	}
}

func (s *TaskService) GetTasks(userID int) ([]models.Task, error) {
	rows, err := s.db.Query(
		`SELECT id, title, description, done, user_id, created_at, updated_at
       FROM tasks
       WHERE user_id = ?
       ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		if err := rows.Scan(
			&t.ID,
			&t.Title,
			&t.Description,
			&t.Done,
			&t.UserID,
			&t.CreatedAt,
			&t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}

	return tasks, rows.Err()
}

func (s *TaskService) GetTask(id, userID int) (*models.Task, error) {
	var t models.Task
	err := s.db.QueryRow(
		`SELECT id, title, description, done, user_id, created_at, updated_at
       FROM tasks
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
		id,
		userID,
	).Scan(
		&t.ID,
		&t.Title,
		&t.Description,
		&t.Done,
		&t.UserID,
		&t.CreatedAt,
		&t.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("task not found")
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *TaskService) CreateTask(req *models.CreateTaskRequest, userID int) (*models.Task, error) {
	now := time.Now()

	res, err := s.db.Exec(
		`INSERT INTO tasks (title, description, done, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
		req.Title,
		req.Description,
		req.Done,
		userID,
		now,
		now,
	)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &models.Task{
		ID:          int(id),
		Title:       req.Title,
		Description: req.Description,
		Done:        req.Done,
		UserID:      userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// Optional helpers if you later want real DB updates/deletes:

func (s *TaskService) UpdateTask(id, userID int, req *models.CreateTaskRequest) (*models.Task, error) {
	now := time.Now()

	_, err := s.db.Exec(
		`UPDATE tasks
       SET title = ?, description = ?, done = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
		req.Title,
		req.Description,
		req.Done,
		now,
		id,
		userID,
	)
	if err != nil {
		return nil, err
	}

	return s.GetTask(id, userID)
}

func (s *TaskService) DeleteTask(id, userID int) error {
	res, err := s.db.Exec(
		`DELETE FROM tasks WHERE id = ? AND user_id = ?`,
		id,
		userID,
	)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errors.New("task not found")
	}
	return nil
}