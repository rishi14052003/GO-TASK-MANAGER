package routes

import (
	"net/http"

	"task-manager-server/internal/handlers"
	"task-manager-server/internal/middleware"
)

func SetupRoutes(authHandler *handlers.AuthHandler, taskHandler *handlers.TaskHandler, admin *handlers.AdminHandler, secret []byte, checkAdmin middleware.AdminCheck) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/register", authHandler.Register)
	mux.HandleFunc("/api/login", authHandler.Login)

	taskMux := http.NewServeMux()
	taskMux.HandleFunc("/api/tasks", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			taskHandler.GetTasks(w, r)
		case http.MethodPost:
			taskHandler.CreateTask(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	taskMux.HandleFunc("/api/tasks/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			taskHandler.UpdateTask(w, r)
		case http.MethodDelete:
			taskHandler.DeleteTask(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.Handle("/api/tasks", middleware.AuthMiddleware(secret, taskMux))
	mux.Handle("/api/tasks/", middleware.AuthMiddleware(secret, taskMux))

	adminMux := http.NewServeMux()
	adminMux.HandleFunc("GET /api/admin/stats", admin.GetStats)
	adminMux.HandleFunc("GET /api/admin/users", admin.GetAllUsers)
	adminMux.HandleFunc("DELETE /api/admin/users/{id}", admin.DeleteUser)
	adminMux.HandleFunc("GET /api/admin/tasks", admin.GetAllTasks)
	adminMux.HandleFunc("DELETE /api/admin/tasks/{id}", admin.DeleteTask)
	mux.Handle("/api/admin/", middleware.AuthMiddleware(secret, middleware.AdminMiddleware(checkAdmin, adminMux)))

	return middleware.CORSMiddleware(mux)
}
