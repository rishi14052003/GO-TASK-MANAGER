package routes

import (
	"net/http"

	"task-manager-server/internal/handlers"
	"task-manager-server/internal/middleware"
)

func SetupRoutes(authHandler *handlers.AuthHandler, taskHandler *handlers.TaskHandler) http.Handler {
	mux := http.NewServeMux()

	// Auth routes (no auth middleware needed)
	mux.HandleFunc("/api/register", authHandler.Register)
	mux.HandleFunc("/api/login", authHandler.Login)

	// Task routes (protected with auth middleware)
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

	// Mount protected task handlers under the main mux
	mux.Handle("/api/tasks", middleware.AuthMiddleware(taskMux))
	mux.Handle("/api/tasks/", middleware.AuthMiddleware(taskMux))

	// Apply CORS middleware to the entire mux
	return middleware.CORSMiddleware(mux)
}
