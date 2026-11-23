package models

import (
	"encoding/json"
	"time"
)

type Task struct {
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Done        bool       `json:"done"`
	Priority    string     `json:"priority"` // "low" | "medium" | "high"
	DueDate     *time.Time `json:"dueDate"`
	UserID      int        `json:"userId"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type CreateTaskRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Done        bool       `json:"done"`
	Priority    string     `json:"priority"`
	DueDate     *time.Time `json:"dueDate"`
}

type UpdateTaskRequest struct {
	Title       *string    `json:"title,omitempty"`
	Description *string    `json:"description,omitempty"`
	Done        *bool      `json:"done,omitempty"`
	Priority    *string    `json:"priority,omitempty"`
	DueDate     *time.Time `json:"dueDate"`
	DueDateSet  bool       `json:"-"`
}

// A missing date leaves an update alone. An explicit null clears the date.
type dueDateInput struct {
	value   *time.Time
	present bool
}

func (d *dueDateInput) UnmarshalJSON(data []byte) error {
	*d = dueDateInput{present: true}
	var value *string
	if err := json.Unmarshal(data, &value); err != nil || value == nil {
		return err
	}
	day, err := time.Parse(time.DateOnly, *value)
	if err != nil {
		day, err = time.Parse(time.RFC3339, *value)
		if err != nil {
			return err
		}
	}
	// The database driver uses loc=Local. Keep the chosen calendar day on write and read.
	midnight := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.Local)
	d.value = &midnight
	return nil
}

func (r *CreateTaskRequest) UnmarshalJSON(data []byte) error {
	type fields CreateTaskRequest
	var input struct {
		fields
		DueDate dueDateInput `json:"dueDate"`
	}
	if err := json.Unmarshal(data, &input); err != nil {
		return err
	}
	*r = CreateTaskRequest(input.fields)
	r.DueDate = input.DueDate.value
	return nil
}

func (r *UpdateTaskRequest) UnmarshalJSON(data []byte) error {
	type fields UpdateTaskRequest
	var input struct {
		fields
		DueDate dueDateInput `json:"dueDate"`
	}
	if err := json.Unmarshal(data, &input); err != nil {
		return err
	}
	*r = UpdateTaskRequest(input.fields)
	r.DueDate = input.DueDate.value
	r.DueDateSet = input.DueDate.present
	return nil
}
