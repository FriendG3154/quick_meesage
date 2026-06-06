package app

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"quick_meesage/backend/ent"
	"quick_meesage/backend/internal/config"
	"quick_meesage/backend/internal/storage"

	"google.golang.org/grpc"
)

type App struct {
	cfg        config.Config
	entClient  *ent.Client
	db         *sql.DB
	httpServer *http.Server
	grpcServer *grpc.Server
}

func New(cfg config.Config, entClient *ent.Client, db *sql.DB, httpServer *http.Server, grpcServer *grpc.Server) *App {
	return &App{
		cfg:        cfg,
		entClient:  entClient,
		db:         db,
		httpServer: httpServer,
		grpcServer: grpcServer,
	}
}

func (a *App) Run(ctx context.Context) error {
	// 先执行 ent 框架的迁移
	if err := storage.Migrate(ctx, a.entClient); err != nil {
		return fmt.Errorf("migrate ent tables: %w", err)
	}
	// 再执行 backend/schema 下的纯 SQL 迁移
	if err := storage.MigrateSQLTables(ctx, a.db); err != nil {
		return fmt.Errorf("migrate sql tables: %w", err)
	}

	listener, err := net.Listen("tcp", a.cfg.GRPCAddr)
	if err != nil {
		return fmt.Errorf("listen grpc: %w", err)
	}

	errs := make(chan error, 2)
	go func() {
		if err := a.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errs <- fmt.Errorf("serve http: %w", err)
		}
	}()
	go func() {
		if err := a.grpcServer.Serve(listener); err != nil {
			errs <- fmt.Errorf("serve grpc: %w", err)
		}
	}()

	select {
	case <-ctx.Done():
		return a.shutdown()
	case err := <-errs:
		_ = a.shutdown()
		return err
	}
}

func (a *App) shutdown() error {
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	httpErr := a.httpServer.Shutdown(shutdownCtx)

	stopped := make(chan struct{})
	go func() {
		a.grpcServer.GracefulStop()
		close(stopped)
	}()

	select {
	case <-stopped:
	case <-shutdownCtx.Done():
		a.grpcServer.Stop()
	}

	if httpErr != nil {
		return fmt.Errorf("shutdown http: %w", httpErr)
	}
	return nil
}
