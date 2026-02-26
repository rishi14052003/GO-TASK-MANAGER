package models

type Task struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Done        bool   `json:"done"`
	UserID      int    `json:"user_id"`
}

type TaskCreateRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type TaskUpdateRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Done        *bool   `json:"done,omitempty"`
}
