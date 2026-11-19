package models

import "time"

type Task struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Done        bool      `json:"done"`
	Priority    string    `json:"priority"` // "low" | "medium" | "high"
	UserID      int       `json:"userId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CreateTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Done        bool   `json:"done"`
	Priority    string `json:"priority"`
}

type UpdateTaskRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Done        *bool   `json:"done,omitempty"`
	Priority    *string `json:"priority,omitempty"`
}
