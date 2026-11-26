package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"task-manager-server/internal/email"
	"task-manager-server/internal/middleware"
	"task-manager-server/internal/services"
)

type delivery struct {
	to   string
	data email.TaskEmailData
}
type mailbox chan delivery

func (m mailbox) SendTaskNotification(to string, data email.TaskEmailData) error {
	m <- delivery{to, data}
	return nil
}

func TestTaskMutationEmails(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	mail := make(mailbox, 1)
	h := NewTaskHandler(services.NewTaskService(db), mail, services.NewAuthService(db, nil))
	const owner = "owner@example.com"
	snapshot := func(title string, done bool) *sqlmock.Rows {
		return sqlmock.NewRows([]string{"id", "title", "description", "done", "priority", "due_date", "user_id", "created_at", "updated_at"}).
			AddRow(42, title, "Notes", done, "medium", nil, 7, time.Now(), time.Now())
	}
	submit := func(method, path, body string, handler http.HandlerFunc, status int) {
		t.Helper()
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		res := httptest.NewRecorder()
		handler(res, req)
		if res.Code != status {
			t.Fatalf("%s: got %d: %s", method, res.Code, res.Body.String())
		}
	}
	recipient := func() {
		mock.ExpectQuery("SELECT id, name, email FROM users").WithArgs(7).WillReturnRows(sqlmock.NewRows([]string{"id", "name", "email"}).AddRow(7, "Owner", owner))
	}
	receive := func(action, title string) []email.TaskChange {
		t.Helper()
		select {
		case msg := <-mail:
			if msg.to != owner || msg.data.Action != action || msg.data.TaskTitle != title || msg.data.UserName != "Owner" {
				t.Fatalf("unexpected delivery: %+v", msg)
			}
			return msg.data.Changes
		case <-time.After(2 * time.Second):
			t.Fatalf("missing %s notification", action)
			return nil
		}
	}

	mock.ExpectExec("INSERT INTO tasks").WillReturnResult(sqlmock.NewResult(42, 1))
	recipient()
	submit("POST", "/api/tasks", `{"title":"Draft","description":"Notes"}`, h.CreateTask, 201)
	receive("created", "Draft")

	mock.ExpectBegin()
	mock.ExpectQuery("SELECT .* FROM tasks .* FOR UPDATE").WithArgs(42, 7).WillReturnRows(snapshot("Draft", false))
	mock.ExpectExec("UPDATE tasks SET").WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectQuery("SELECT .* FROM tasks").WithArgs(42, 7).WillReturnRows(snapshot("Final", true))
	mock.ExpectCommit()
	recipient()
	submit("PUT", "/api/tasks/42", `{"title":"Final","done":true}`, h.UpdateTask, 200)
	changes := receive("updated", "Final")
	if len(changes) != 2 || changes[0] != (email.TaskChange{Field: "Title", OldValue: "Draft", NewValue: "Final"}) ||
		changes[1] != (email.TaskChange{Field: "Status", OldValue: "Pending", NewValue: "Completed"}) {
		t.Fatalf("wrong changes: %+v", changes)
	}

	mock.ExpectBegin()
	mock.ExpectQuery("SELECT .* FROM tasks .* FOR UPDATE").WithArgs(42, 7).WillReturnRows(snapshot("Final", true))
	mock.ExpectExec("DELETE FROM tasks").WithArgs(42, 7).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()
	recipient()
	submit("DELETE", "/api/tasks/42", "", h.DeleteTask, 200)
	receive("deleted", "Final")
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
