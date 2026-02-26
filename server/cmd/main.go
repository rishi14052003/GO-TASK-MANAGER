package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Task struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

func tasksHandler(w http.ResponseWriter, r *http.Request) {
	tasks := []Task{
		{ID: 1, Title: "Learn Go", Done: false},
		{ID: 2, Title: "Build API", Done: false},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func main() {
	fmt.Println("Server starting on port 8080...")
	fmt.Println("Welcome to the Task Manager API!")

	http.HandleFunc("/tasks", tasksHandler)

	http.ListenAndServe(":8080", nil)
}
