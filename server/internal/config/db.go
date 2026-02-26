package config

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

// NewDB initializes and returns a MySQL *sql.DB connection using environment variables.
// Expected env vars:
//   - DB_HOST (e.g. "localhost:3306")
//   - DB_USER
//   - DB_PASS
//   - DB_NAME
func NewDB() (*sql.DB, error) {
	host := getenv("DB_HOST", "localhost:3306")
	user := getenv("DB_USER", "root")
	pass := getenv("DB_PASS", "")
	name := getenv("DB_NAME", "task_manager")

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
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

