package routes

import (
	"net/http"

	"task-manager-server/internal/handlers"
	"task-manager-server/internal/middleware"
)

func SetupRoutes(authHandler *handlers.AuthHandler) http.Handler {
	mux := http.NewServeMux()

	// Auth routes
	mux.HandleFunc("/api/register", authHandler.Register)
	mux.HandleFunc("/api/login", authHandler.Login)

	// Apply CORS middleware
	return middleware.CORSMiddleware(mux)
}
