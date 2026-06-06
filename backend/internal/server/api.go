package server

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/google/wire"

	"quick_message/backend/ent"
	"quick_message/backend/internal/conf"
	"quick_message/backend/internal/handler"
)

type ApiServer struct {
	cfg     *conf.Config
	ent     *ent.Client
	handler *handler.HealthHandler
	srv     *http.Server
}

// WireSet 把 ApiServer 自身和它依赖的 HealthHandler 都纳入 wire 图。
var WireSet = wire.NewSet(
	NewApiServer,
	handler.NewHealthHandler,
)

func NewApiServer(c *conf.Config, db *ent.Client, h *handler.HealthHandler) (*ApiServer, func(), error) {
	mux := http.NewServeMux()
	// Go 1.22+ 模式路由:可直接限定 HTTP method。
	mux.HandleFunc("GET /healthz", h.Get)
	mux.HandleFunc("GET /", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("quick_message backend\n"))
	})

	port := c.Port
	if port == 0 {
		port = 6789
	}

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", port),
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	return &ApiServer{
		cfg:     c,
		ent:     db,
		handler: h,
		srv:     srv,
	}, func() {}, nil
}

// Run 启动 HTTP 服务,阻塞直到 ctx 取消或 Serve 返回。
// 先 net.Listen 再 Serve,端口冲突可以立即在主流程中失败。
func (a *ApiServer) Run(ctx context.Context) error {
	ln, err := net.Listen("tcp", a.srv.Addr)
	if err != nil {
		return fmt.Errorf("listen %s: %w", a.srv.Addr, err)
	}
	slog.Info("api server listening", "addr", ln.Addr().String())

	errCh := make(chan error, 1)
	go func() { errCh <- a.srv.Serve(ln) }()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := a.srv.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("graceful shutdown: %w", err)
		}
		return nil
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
