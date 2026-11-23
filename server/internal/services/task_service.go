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
	return &TaskService{db: db}
}

func validPriority(p string) string {
	switch p {
	case "low", "medium", "high":
		return p
	default:
		return "medium"
	}
}

func (s *TaskService) GetTasks(userID int) ([]models.Task, error) {
	rows, err := s.db.Query(
		`SELECT id, title, description, done, priority, due_date, user_id, created_at, updated_at
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
			&t.ID, &t.Title, &t.Description, &t.Done, &t.Priority, &t.DueDate,
			&t.UserID, &t.CreatedAt, &t.UpdatedAt,
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
		`SELECT id, title, description, done, priority, due_date, user_id, created_at, updated_at
		 FROM tasks WHERE id = ? AND user_id = ? LIMIT 1`,
		id, userID,
	).Scan(&t.ID, &t.Title, &t.Description, &t.Done, &t.Priority, &t.DueDate,
		&t.UserID, &t.CreatedAt, &t.UpdatedAt)
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
	priority := validPriority(req.Priority)

	res, err := s.db.Exec(
		`INSERT INTO tasks (title, description, done, priority, due_date, user_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		req.Title, req.Description, req.Done, priority, req.DueDate, userID, now, now,
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
		Priority:    priority,
		DueDate:     req.DueDate,
		UserID:      userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func (s *TaskService) UpdateTask(id, userID int, req *models.UpdateTaskRequest) (*models.Task, error) {
	var priority *string
	if req.Priority != nil {
		p := validPriority(*req.Priority)
		priority = &p
	}
	_, err := s.db.Exec(
		`UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description),
		 done = COALESCE(?, done), priority = COALESCE(?, priority),
		 due_date = IF(?, ?, due_date), updated_at = ?
		 WHERE id = ? AND user_id = ?`,
		req.Title, req.Description, req.Done, priority, req.DueDateSet || req.DueDate != nil,
		req.DueDate, time.Now(), id, userID,
	)
	if err != nil {
		return nil, err
	}
	return s.GetTask(id, userID)
}

func (s *TaskService) DeleteTask(id, userID int) error {
	res, err := s.db.Exec(`DELETE FROM tasks WHERE id = ? AND user_id = ?`, id, userID)
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
