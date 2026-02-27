package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	godotenv "github.com/joho/godotenv"
)

// NewDB initializes and returns a MySQL *sql.DB connection using environment variables.
// Expected env vars:
//   - DB_HOST (e.g. "localhost:3306")
//   - DB_USER
//   - DB_PASS
//   - DB_NAME
func NewDB() (*sql.DB, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	} else {
		log.Println(".env file loaded successfully")
	}

	host := getenv("DB_HOST", "localhost:3306")
	user := getenv("DB_USER", "root")
	pass := getenv("DB_PASS", "")
	name := getenv("DB_NAME", "task_manager")

	log.Printf("Connecting to MySQL with: host=%s, user=%s, db=%s, pass_length=%d", host, user, name, len(pass))

	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true&charset=utf8mb4&loc=Local", user, pass, host, name)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func getenv(key, fallback string) string {
	// Check .env file first (already loaded by godotenv)
	if v := os.Getenv(key); v != "" {
		return v
	}
	// Use fallback if no environment variable is set
	return fallback
}
