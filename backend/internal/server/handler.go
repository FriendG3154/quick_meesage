package server

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"quick_message/backend/internal/conf"
	imiddleware "quick_message/backend/internal/handler/middleware"
	"quick_message/backend/internal/manager/iam"
	v1 "quick_message/proto/generated-go/v1"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"github.com/soheilhy/cmux"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/reflect/protoregistry"
)

var greetingColor = string([]byte{27, 91, 51, 50, 109})

const (
	// http://patorjk.com/software/taag/#p=display&f=ANSI%20Shadow&t=mdzf-crm
	greetingBanner = `
____________________________________________________________________________

███████╗████████╗ █████╗ ██████╗ ████████╗
██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝
███████╗   ██║   ███████║██████╔╝   ██║   
╚════██║   ██║   ██╔══██║██╔══██╗   ██║   
███████║   ██║   ██║  ██║██║  ██║   ██║   
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝                                                                            
_____________________________________________________________________________
`

	endBanner = `
_____________________________________________________________________________

███████╗███╗   ██╗██████╗ 
██╔════╝████╗  ██║██╔══██╗
█████╗  ██╔██╗ ██║██║  ██║
██╔══╝  ██║╚██╗██║██║  ██║
███████╗██║ ╚████║██████╔╝
╚══════╝╚═╝  ╚═══╝╚═════╝   
_____________________________________________________________________________
`
)

type ApiServer struct {
	port string

	echoServer *echo.Echo
	httpServer *http.Server // v5: Echo 不再内置 http.Server，需自建
	muxServer  cmux.CMux

	cancel context.CancelFunc
}

func NewHandlerServer(
	cfg *conf.Config,
	iamManager *iam.IamManager,
) *ApiServer {
	port := fmt.Sprintf(":%d", cfg.Port)

	server := &ApiServer{

		port: port,
	}

	tcpLis, err := net.Listen("tcp", port)
	if err != nil {
		fmt.Printf("failed to listen: %v\n", err)
		panic(err)
	}

	server.muxServer = cmux.New(tcpLis)

	mdw := imiddleware.NewInterceptor(methodExtends, iamManager)

	// Create Echo instance.
	server.echoServer = echo.New()
	server.echoServer.Use(middleware.Recover())
	server.echoServer.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		// 设置为 24 小时 (86400 秒)
		// 适合生产环境，能显著减少 OPTIONS 请求次数，提升性能
		MaxAge: 86400,
		UnsafeAllowOriginFunc: func(c *echo.Context, origin string) (allowedOrigin string, allowed bool, err error) {
			if strings.HasSuffix(origin, ".mdzf.net") {
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

	// Create HTTP server using grpc-gateway.
	server.grpcGatewayMux = grpcruntime.NewServeMux(
		grpcruntime.WithIncomingHeaderMatcher(imiddleware.IncomingHeaderMatcher),
		grpcruntime.WithErrorHandler(imiddleware.CustomHTTPErrorHandler),
		grpcruntime.WithForwardResponseOption(mdw.Modify),
		grpcruntime.WithRoutingErrorHandler(func(ctx context.Context, sm *grpcruntime.ServeMux, m grpcruntime.Marshaler, w http.ResponseWriter, r *http.Request, httpStatus int) {
			if httpStatus != http.StatusNotFound {
				grpcruntime.DefaultRoutingErrorHandler(ctx, sm, m, w, r, httpStatus)
				return
			}

			err := &grpcruntime.HTTPStatusError{
				HTTPStatus: httpStatus,
				Err:        status.Errorf(codes.NotFound, "Routing error. Please check the request URI %v", r.RequestURI),
			}

			grpcruntime.DefaultHTTPErrorHandler(ctx, sm, m, w, r, err)
		}),
	)

	ctx, cancel := context.WithCancel(context.Background())
	server.cancel = cancel

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithDefaultCallOptions(
			grpc.MaxCallRecvMsgSize(100 * 1024 * 1024),
		),
	}

	// 统一注册：避免遗漏任一服务的 gRPC 与 HTTP 网关注册
	type serviceRegistrar struct {
		name string
		// registerGRPC func()
		registerHTTP func() error
	}

	registrars := []serviceRegistrar{
		{
			name: v1.AuthService_ServiceDesc.ServiceName,
			// registerGRPC: func() { v1.RegisterAuthServiceServer(server.grpcServer, authHandler) },
			registerHTTP: func() error {
				return v1.RegisterAuthServiceHandlerFromEndpoint(ctx, server.grpcGatewayMux, port, opts)
			},
		},
	}

	// 2) HTTP 网关注册
	for _, r := range registrars {
		if err := r.registerHTTP(); err != nil {
			fmt.Printf("failed to register handler for %s: %v\n", r.name, err)
			panic(err)
		}
	}

	// 3) 自检：确保 v1 包中的所有 gRPC Service 均已注册（避免遗漏）
	registered := make(map[string]struct{}, len(registrars))
	for _, r := range registrars {
		registered[r.name] = struct{}{}
	}

	// 通过任一已知服务名推导 v1 包前缀（去掉最后一个 .Service 名）
	pkgPrefix := v1.AuthService_ServiceDesc.ServiceName
	if idx := strings.LastIndex(pkgPrefix, "."); idx != -1 {
		pkgPrefix = pkgPrefix[:idx]
	}

	missing := make([]string, 0)
	protoregistry.GlobalFiles.RangeFiles(func(fd protoreflect.FileDescriptor) bool {
		services := fd.Services()
		for i := 0; i < services.Len(); i++ {
			svc := services.Get(i)
			name := string(svc.FullName())
			if !strings.HasPrefix(name, pkgPrefix+".") {
				continue
			}
			if _, ok := registered[name]; !ok {
				missing = append(missing, name)
			}
		}
		return true
	})
	if len(missing) > 0 {
		panic(fmt.Sprintf("unregistered gRPC services (please add to registrars): %v", missing))
	}

	// =============== 注册 Echo 专属路由（文件上传） ===============
	// 必须在 grpcGateway 兜底路由之前注册，否则会被 grpcGateway 拦截
	server.echoServer.POST("/v1/files", fileHandler.UploadHandler, mdw.EchoAuth())

	// v5: Echo 不再内置 http.Server，用 cmux 时需自建
	server.httpServer = &http.Server{
		Handler: server.echoServer,
	}

	// =============== grpcGateway 兜底路由（必须放在最后） ===============
	server.echoServer.Any("/*", echo.WrapHandler(server.grpcGatewayMux))

	return server
}

// Run 启动 gRPC + HTTP 服务，阻塞直到 ctx 取消
func (s *ApiServer) Run(ctx context.Context) error {

	grpcL := s.muxServer.MatchWithWriters(
		cmux.HTTP2MatchHeaderFieldSendSettings("content-type", "application/grpc"),
	)
	httpL := s.muxServer.Match(cmux.HTTP1Fast(), cmux.Any())

	errCh := make(chan error, 3)

	go func() {
		if err := s.grpcServer.Serve(grpcL); err != nil {
			errCh <- fmt.Errorf("grpc: %w", err)
		}
	}()

	go func() {
		if err := s.httpServer.Serve(httpL); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("http: %w", err)
		}
	}()

	go func() {
		if err := s.muxServer.Serve(); err != nil {
			errCh <- fmt.Errorf("cmux: %w", err)
		}
	}()

	fmt.Println(greetingColor, greetingBanner, greetingColor)
	slog.Info("API 服务已启动", "port", s.port)

	// 等待 ctx 取消或服务异常
	var retErr error
	select {
	case <-ctx.Done():
	case retErr = <-errCh:
	}

	// 优雅关停
	slog.Info(endBanner)
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if s.cancel != nil {
		s.cancel()
	}

	if s.grpcServer != nil {
		stopped := make(chan struct{})
		go func() {
			s.grpcServer.GracefulStop()
			close(stopped)
		}()
		select {
		case <-time.After(1 * time.Second):
			s.grpcServer.Stop()
		case <-stopped:
		}
	}
	if s.httpServer != nil {
		s.httpServer.Shutdown(shutdownCtx)
	}
	if s.muxServer != nil {
		s.muxServer.Close()
	}

	return retErr
}
