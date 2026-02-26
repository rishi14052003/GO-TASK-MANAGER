package repository

import (
	"database/sql"

	"task-manager-server/internal/models"
)

type TaskRepository interface {
	Create(task *models.Task) error
	GetByUserID(userID int) ([]*models.Task, error)
	GetByID(id int) (*models.Task, error)
	Update(task *models.Task) error
	Delete(id int) error
}

type taskRepository struct {
	db *sql.DB
}

func NewTaskRepository(db *sql.DB) TaskRepository {
	return &taskRepository{db: db}
}

func (r *taskRepository) Create(task *models.Task) error {
	query := `
		INSERT INTO tasks (title, description, completed, user_id)
		VALUES (?, ?, ?, ?)
	`
	result, err := r.db.Exec(query, task.Title, task.Description, task.Done, task.UserID)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	task.ID = int(id)
	return nil
}

func (r *taskRepository) GetByUserID(userID int) ([]*models.Task, error) {
	query := `
		SELECT id, title, description, completed, user_id, created_at
		FROM tasks
		WHERE user_id = ?
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		var t models.Task
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Done, &t.UserID, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, &t)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *taskRepository) GetByID(id int) (*models.Task, error) {
	query := `
		SELECT id, title, description, completed, user_id, created_at, updated_at
		FROM tasks
		WHERE id = ?
		LIMIT 1
	`
	row := r.db.QueryRow(query, id)

	var t models.Task
	if err := row.Scan(&t.ID, &t.Title, &t.Description, &t.Done, &t.UserID, &t.CreatedAt, &t.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &t, nil
}

func (r *taskRepository) Update(task *models.Task) error {
	query := `
		UPDATE tasks
		SET title = ?, description = ?, completed = ?
		WHERE id = ?
	`
	_, err := r.db.Exec(query, task.Title, task.Description, task.Done, task.ID)
	return err
}

func (r *taskRepository) Delete(id int) error {
	query := `
		DELETE FROM tasks
		WHERE id = ?
	`
	_, err := r.db.Exec(query, id)
	return err
}
