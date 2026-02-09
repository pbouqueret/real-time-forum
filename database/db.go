package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3" // SQLite driver
)

var DB *sql.DB

// InitDB initializes the SQLite database connection and runs migrations
func InitDB(dataSourceName string) error {
	var err error
	DB, err = sql.Open("sqlite3", dataSourceName)
	if err != nil {
		return fmt.Errorf("error opening database: %w", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("error verifying database connection: %w", err)
	}

	log.Println("Database connection established")

	if err = runMigrations("database/migrations.sql"); err != nil {
		return fmt.Errorf("error running migrations: %w", err)
	}

	return nil
}

// runMigrations executes the SQL statements in the provided file path
func runMigrations(filePath string) error {
	migrationBytes, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	_, err = DB.Exec(string(migrationBytes))
	if err != nil {
		return fmt.Errorf("failed to execute migration script: %w", err)
	}

	log.Println("Database migrations executed successfully")
	return nil
}
