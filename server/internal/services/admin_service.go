package services

import (
	"context"
	"database/sql"
	"time"

	"task-manager-server/internal/models"
)

type AdminService struct{ db *sql.DB }

func NewAdminService(db *sql.DB) *AdminService { return &AdminService{db: db} }

func (s *AdminService) IsAdmin(ctx context.Context, id int) (bool, error) {
	var allowed bool
	err := s.db.QueryRowContext(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE id = ? AND is_admin = 1)", id).Scan(&allowed)
	return allowed, err
}

type AdminStats struct {
	TotalUsers     int     `json:"totalUsers"`
	TotalTasks     int     `json:"totalTasks"`
	CompletedTasks int     `json:"completedTasks"`
	CompletionRate float64 `json:"completionRate"`
}

func (s *AdminService) GetStats(ctx context.Context) (AdminStats, error) {
	var stats AdminStats
	err := s.db.QueryRowContext(ctx, `SELECT (SELECT COUNT(*) FROM users), COUNT(*),
        COUNT(CASE WHEN done = 1 THEN 1 END) FROM tasks`).Scan(&stats.TotalUsers, &stats.TotalTasks, &stats.CompletedTasks)
	if stats.TotalTasks > 0 {
		stats.CompletionRate = 100 * float64(stats.CompletedTasks) / float64(stats.TotalTasks)
	}
	return stats, err
}

func (s *AdminService) GetAllUsers(ctx context.Context) ([]models.User, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, email, is_admin, created_at
        FROM users ORDER BY created_at DESC, id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.IsAdmin, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

type AdminTask struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	UserID    int       `json:"userId"`
	UserName  string    `json:"userName"`
	Priority  string    `json:"priority"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *AdminService) GetAllTasks(ctx context.Context) ([]AdminTask, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT t.id, t.title, u.id, u.name, COALESCE(t.priority, 'medium'), t.done, t.created_at
        FROM tasks t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC, t.id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tasks := []AdminTask{}
	for rows.Next() {
		var t AdminTask
		if err := rows.Scan(&t.ID, &t.Title, &t.UserID, &t.UserName, &t.Priority, &t.Done, &t.CreatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func (s *AdminService) DeleteUser(ctx context.Context, id int) error {
	return s.delete(ctx, "DELETE FROM users WHERE id = ?", id)
}

func (s *AdminService) DeleteTask(ctx context.Context, id int) (*models.Task, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	var task models.Task
	err = tx.QueryRowContext(ctx, "SELECT user_id, title, COALESCE(description, '') FROM tasks WHERE id = ? FOR UPDATE", id).Scan(&task.UserID, &task.Title, &task.Description)
	if err != nil {
		return nil, err
	}
	if _, err = tx.ExecContext(ctx, "DELETE FROM tasks WHERE id = ?", id); err != nil {
		return nil, err
	}
	return &task, tx.Commit()
}

func (s *AdminService) delete(ctx context.Context, query string, id int) error {
	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return sql.ErrNoRows
	}
	return err
}
