package server

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"quick_message/backend/internal/conf"
	"quick_message/backend/internal/data"
	"quick_message/backend/internal/handler"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

var greetingColor = string([]byte{27, 91, 51, 50, 109})

const greetingBanner = `
____________________________________________________________________________

███████╗████████╗ █████╗ ██████╗ ████████╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝
███████╗   ██║   ███████║██████╔╝   ██║
╚════██║   ██║   ██╔══██║██╔══██╗   ██║
███████║   ██║   ██║  ██║██║  ██║   ██║
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
_____________________________________________________________________________
`

const endBanner = `
_____________________________________________________________________________

███████╗███╗   ██╗██████╗
██╔════╝████╗  ██║██╔══██╗
█████╗  ██╔██╗ ██║██║  ██║
██╔══╝  ██║╚██╗██║██║  ██║
███████╗██║ ╚████║██████╔╝
╚══════╝╚═╝  ╚═══╝╚═════╝
_____________________________________________________________________________
`

type ApiServer struct {
	port       string
	echoServer *echo.Echo
	httpServer *http.Server
	dbClient   *data.Client
}

func NewHandlerServer(cfg *conf.Config, dbClient *data.Client, healthHandler *handler.HealthHandler) (*ApiServer, func(), error) {
	e := echo.New()
	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())
	e.Use(middleware.RequestLogger())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		// 设置为 24 小时 (86400 秒)
		// 适合生产环境，能显著减少 OPTIONS 请求次数，提升性能
		MaxAge: 86400,
		UnsafeAllowOriginFunc: func(c *echo.Context, origin string) (allowedOrigin string, allowed bool, err error) {
			if strings.HasSuffix(origin, ".gingin.top") {
				return origin, true, nil
			}

			if strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") ||
				strings.HasPrefix(origin, "http://192.168.") {
				return origin, true, nil
			}
			return "", false, nil
		},
		// AllowCredentials true 跟 AllowOrigins '*' 不能同时使用
		// 是否允许发送 Cookie 或 HTTP 认证信息（如 JWT/Session）
		AllowCredentials: true,
		// 允许的 HTTP 方法
		AllowMethods: []string{
			http.MethodGet,
			http.MethodHead,
			http.MethodPut,
			http.MethodPatch,
			http.MethodPost,
			http.MethodDelete,
			http.MethodOptions,
		},
		// 允许的请求头部，确保包含 'Authorization' 等关键头部
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization, // 必须包含这个才能发送 JWT/Bearer Token
			"Client-Version",
			echo.HeaderAccessControlAllowHeaders,
			echo.HeaderXCSRFToken, // 如果您使用 CSRF 保护
			echo.HeaderXRequestedWith,
		},
	}))

	// 路由注册(详见 routes.go)
	RegisterRoutes(e, &Handlers{Health: healthHandler})

	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: e,
	}

	cleanup := func() {
		if dbClient != nil {
			_ = dbClient.Close()
		}
	}

	return &ApiServer{
		port:       httpServer.Addr,
		echoServer: e,
		httpServer: httpServer,
		dbClient:   dbClient,
	}, cleanup, nil
}

// Run 启动 HTTP 服务,阻塞直到 ctx 取消
func (s *ApiServer) Run(ctx context.Context) error {
	fmt.Println(greetingColor, greetingBanner, greetingColor)
	slog.Info("API 服务已启动", "port", s.port)

	errCh := make(chan error, 1)
	go func() {
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("http: %w", err)
		}
	}()

	var retErr error
	select {
	case <-ctx.Done():
	case retErr = <-errCh:
	}

	slog.Info(endBanner)
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = s.httpServer.Shutdown(shutdownCtx)

	return retErr
}
