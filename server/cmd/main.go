package main

import (
	"crypto/rand"
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

	secret := []byte(os.Getenv("JWT_SECRET"))
	if len(secret) < 32 || string(secret) == "your-secret-key-change-in-production" {
		secret = make([]byte, 32)
		rand.Read(secret)
		log.Print("Using a per-process signing key. Configure JWT_SECRET with a random secret of at least 32 bytes for persistent sessions.")
	}
	adminService := services.NewAdminService(db)
	adminHandler := handlers.NewAdminHandler(adminService)
	authService := services.NewAuthService(db, secret)
	taskService := services.NewTaskService(db)

	authHandler := handlers.NewAuthHandler(authService, taskService, secret)
	taskHandler := handlers.NewTaskHandler(taskService)

	userService := services.NewUserService(db)
	userHandler := handlers.NewUserHandler(userService)

	router := routes.SetupRoutes(authHandler, taskHandler, adminHandler, userHandler, secret, adminService.IsAdmin)

	finalHandler := middleware.CORSMiddleware(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, finalHandler))
}
