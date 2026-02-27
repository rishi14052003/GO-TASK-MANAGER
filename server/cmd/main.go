package main

import (
	"log"
	"net/http"

	"task-manager-server/internal/config"
	"task-manager-server/internal/handlers"
	"task-manager-server/internal/middleware"
	"task-manager-server/internal/routes"
	"task-manager-server/internal/services"
)

func main() {
	db, err := config.NewDB()
	if err != nil {
		log.Fatalf("failed to connect DB: %v", err)
	}
	defer db.Close()

	authService := services.NewAuthService(db)
	taskService := services.NewTaskService(db)

	authHandler := handlers.NewAuthHandler(authService, taskService)
	taskHandler := handlers.NewTaskHandler(taskService)

	// Setup routes
	router := routes.SetupRoutes(authHandler, taskHandler)

	// Apply CORS middleware
	finalHandler := middleware.CORSMiddleware(router)

	log.Fatal(http.ListenAndServe(":8080", finalHandler))
}