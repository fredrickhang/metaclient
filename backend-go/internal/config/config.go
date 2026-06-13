package config

import "os"

// Config holds all application configuration loaded from environment variables.
type Config struct {
	DBDSN            string
	ServerPort       string
	GinMode          string
	RunningHubAPIKey string
}

// Load reads configuration from environment variables.
func Load() *Config {
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = "debug"
	}
	return &Config{
		DBDSN:            os.Getenv("DB_DSN"),
		ServerPort:       port,
		GinMode:          mode,
		RunningHubAPIKey: os.Getenv("RUNNINGHUB_API_KEY"),
	}
}
