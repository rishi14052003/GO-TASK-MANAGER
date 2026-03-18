package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	godotenv "github.com/joho/godotenv"
)

func NewDB() (*sql.DB, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	} else {
		log.Println(".env file loaded successfully")
	}

	host := getenv("DB_HOST", "localhost:3306")
	user := getenv("DB_USER", "root")
	pass := getenv("DB_PASS", "")
	name := getenv("DB_NAME", "task_manager")
	sslMode := getenv("DB_SSL", "false")

	log.Printf("Connecting to MySQL with: host=%s, user=%s, db=%s, pass_length=%d", host, user, name, len(pass))

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s)/%s?parseTime=true&charset=utf8mb4&loc=Local&tls=%s",
		user, pass, host, name, sslMode,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to connect DB: %w", err)
	}

	return db, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}