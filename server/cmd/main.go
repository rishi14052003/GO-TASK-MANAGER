package main

import (
	"log"
	"net/http"
	"os"

	"task-manager-server/internal/config"
	"task-manager-server/internal/handlers"
	"task-manager-server/internal/repository"
	"task-manager-server/internal/routes"
	"task-manager-server/internal/services"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	db, err := config.NewDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	taskRepo := repository.NewTaskRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo)
	taskService := services.NewTaskService(taskRepo)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	taskHandler := handlers.NewTaskHandler(taskService)

	// Setup routes
	handler := routes.SetupRoutes(authHandler, taskHandler)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
