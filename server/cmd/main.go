package main

import (
	"log"
	"net/http"
	"os"

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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, finalHandler))
}
