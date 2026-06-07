package server

import (
	"net/http"

	"quick_message/backend/internal/handler"

	"github.com/labstack/echo/v5"
)

// route 一条路由记录
type route struct {
	method  string
	path    string
	handler echo.HandlerFunc
}

// RegisterRoutes 注册所有业务路由到 Echo 实例。
// 加新路由只动这个函数里的 routes 切片,不需要碰 handler.go。
func RegisterRoutes(e *echo.Echo, h *Handlers) {
	for _, r := range buildRoutes(h) {
		// "ANY" 走 e.Any,内部展开成所有 HTTP method
		// 其他 method 直接 e.Add
		if r.method == "ANY" {
			e.Any(r.path, r.handler)
			continue
		}
		e.Add(r.method, r.path, r.handler)
	}
}

// Handlers 聚合所有业务 handler,RegisterRoutes 依赖它注入。
// 加新 handler 只需:1) 在这里加字段 2) 在 NewApiServer 里加参数 3) 在 buildRoutes 里加路由。
type Handlers struct {
	Health *handler.HealthHandler
}

func buildRoutes(h *Handlers) []route {
	return []route{
		{
			method: http.MethodGet,
			path:   "/healthz",
			handler: func(c *echo.Context) error {
				// health.go 用的是 http.Handler 风格,这里适配一下
				h.Health.Get(c.Response(), c.Request())
				return nil
			},
		},
		{
			method: "ANY",
			path:   "/*",
			handler: func(c *echo.Context) error {
				// 兜底:未注册路径返回 JSON 404
				return c.JSON(http.StatusNotFound, map[string]string{
					"error": "not found",
					"path":  c.Request().URL.Path,
				})
			},
		},
	}
}
