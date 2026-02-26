package routes

import (
	"net/http"
	"task-manager-server/internal/handlers"
	"task-manager-server/internal/middleware"
)

func SetupRoutes(authHandler *handlers.AuthHandler, taskHandler *handlers.TaskHandler) http.Handler {
	mux := http.NewServeMux()

	// Auth routes (public)
	mux.HandleFunc("POST /api/register", authHandler.Register)
	mux.HandleFunc("POST /api/login", authHandler.Login)

	// Task routes (protected)
	mux.Handle("GET /api/tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.GetTasks)))
	mux.Handle("POST /api/tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.CreateTask)))
	mux.Handle("PUT /api/tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.UpdateTask)))
	mux.Handle("DELETE /api/tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.DeleteTask)))

	// Apply CORS middleware to all routes
	return middleware.CORSMiddleware(mux)
}
