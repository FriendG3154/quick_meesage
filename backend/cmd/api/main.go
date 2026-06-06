package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"quick_meesage/backend/internal/app"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	application, cleanup, err := app.Initialize()
	if err != nil {
		slog.Error("initialize app", "error", err)
		os.Exit(1)
	}
	if cleanup != nil {
		defer cleanup()
	}

	if err := application.Run(ctx); err != nil {
		slog.Error("run app", "error", err)
		os.Exit(1)
	}
}
