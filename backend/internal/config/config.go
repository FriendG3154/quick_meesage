package config

import "os"

type Config struct {
	HTTPAddr    string
	GRPCAddr    string
	DatabaseURL string
}

func New() Config {
	return Config{
		HTTPAddr:    envOr("HTTP_ADDR", ":8080"),
		GRPCAddr:    envOr("GRPC_ADDR", ":9090"),
		DatabaseURL: envOr("DATABASE_URL", "file:quick_meesage.db?cache=shared&_fk=1"),
	}
}

func envOr(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
