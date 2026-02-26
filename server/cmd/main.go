package main

import (
	"log"
	"net/http"

	"task-manager-server/internal/handlers"
	"task-manager-server/internal/middleware"
	"task-manager-server/internal/routes"
	"task-manager-server/internal/services"
)

func main() {
	log.Println("Server starting on port 8080...")
	log.Println("Welcome to Task Manager API with Authentication!")

	// Initialize services
	authService := services.NewAuthService()
	taskService := services.NewTaskService()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, taskService)
	taskHandler := handlers.NewTaskHandler(taskService)

	// Setup routes
	router := routes.SetupRoutes(authHandler, taskHandler)

	// Apply CORS middleware
	finalHandler := middleware.CORSMiddleware(router)

	log.Fatal(http.ListenAndServe(":8080", finalHandler))
}
