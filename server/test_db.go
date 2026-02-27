package main

import (
	"database/sql"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// Connection string for your database
	dsn := "root:root@tcp(localhost:3306)/task_manager?parseTime=true&charset=utf8mb4&loc=Local"

	log.Printf("Connecting to database: task_manager")

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test the connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	log.Println("Database connection successful!")

	// Check if tasks table exists
	var tableName string
	err = db.QueryRow("SHOW TABLES LIKE 'tasks'").Scan(&tableName)
	if err == sql.ErrNoRows {
		log.Println("Tasks table does not exist. Creating it...")

		// Create tasks table
		createTableSQL := `
		CREATE TABLE tasks (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description TEXT,
			done BOOLEAN DEFAULT FALSE,
			user_id INT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)`

		_, err = db.Exec(createTableSQL)
		if err != nil {
			log.Fatalf("Failed to create tasks table: %v", err)
		}

		log.Println("Tasks table created successfully!")
	} else if err != nil {
		log.Fatalf("Error checking tasks table: %v", err)
	} else {
		log.Println("Tasks table already exists")
	}

	// Check if users table exists
	err = db.QueryRow("SHOW TABLES LIKE 'users'").Scan(&tableName)
	if err == sql.ErrNoRows {
		log.Println("Users table does not exist. Creating it...")

		// Create users table
		createTableSQL := `
		CREATE TABLE users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`

		_, err = db.Exec(createTableSQL)
		if err != nil {
			log.Fatalf("Failed to create users table: %v", err)
		}

		log.Println("Users table created successfully!")
	} else if err != nil {
		log.Fatalf("Error checking users table: %v", err)
	} else {
		log.Println("Users table already exists")
	}
}
