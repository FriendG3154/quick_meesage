package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"golang.org/x/time/rate"

	"mdzf-jiajuguan/backend/internal/manager/iam"
	v1 "mdzf-jiajuguan/proto/generated-go/v1"

	errs "github.com/pkg/errors"

	"github.com/labstack/echo/v5"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"

	"github.com/panjf2000/ants/v2"
)

// Interceptor is the interceptor for gRPC server.
type Interceptor struct {
	methoder        map[string]*v1.MethodExtend
	rateLimiters    map[string]*rate.Limiter
	iamManager      *iam.IamManager
	taskPool        *ants.Pool
	logger          *slog.Logger
	errorDiagnostic *ErrorDiagnostic
}

// New returns a new API auth interceptor.
func NewInterceptor(
	methoder map[string]*v1.MethodExtend,
	iamManager *iam.IamManager,
) *Interceptor {
	numCPU := runtime.NumCPU()

	taskPool, err := ants.NewPool(numCPU*100, ants.WithPreAlloc(true))
	if err != nil {
		panic(err)
	}

	rateLimiters := make(map[string]*rate.Limiter)
	// 根据你的方法扩展配置初始化速率限制器
	for k, v := range methoder {
		if v.Permission != "" {
			if !iamManager.PermissionExists(v.Permission) {
				panic(fmt.Sprintf("权限ID %s 在IAM中未定义，方法 %s", v.Permission, k))
			}
		}

		limiter := rate.NewLimiter(rate.Limit(v.Qps), int(v.Qps*2)) // 令牌桶容量为QPS的两倍
		rateLimiters[k] = limiter
	}

	// 创建一个 JSON 格式的日志处理器
	// 这将把你的日志输出为结构化的 JSON 格式，便于机器解析
	jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,           // 增加代码行信息
		Level:     slog.LevelInfo, // 设置日志级别，只记录 Info 及以上
	})

	logger := slog.New(jsonHandler)

	return &Interceptor{
		methoder:        methoder,
		rateLimiters:    rateLimiters,
		iamManager:      iamManager,
		taskPool:        taskPool,
		logger:          logger,
		errorDiagnostic: NewErrorDiagnostic(logger),
	}
}

// auth
// permission
// validator
// audit审计日志
func (in *Interceptor) UnaryServerInterceptor(ctxx context.Context, request any, serverInfo *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
	fullName := serverInfo.FullMethod
	extend, err := in.getMethodExtend(fullName)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(ctxx, time.Duration(extend.Timeout)*time.Millisecond)
	defer cancel()

	// 获取客户端 IP
	clientIP := GetGrpcClientIP(ctx)
	ctx = context.WithValue(ctx, iam.UserIPKey, clientIP)

	// 速率控制
	if limiter, ok := in.rateLimiters[fullName]; ok {
		// 使用 WaitN 来确保请求在被允许之前会等待
		// 也可以使用 Allow() 来立即拒绝
		if !limiter.Allow() {
			return nil, status.Error(codes.ResourceExhausted, "请求过于频繁，请稍后再试")
		}
		// 使用 WaitN 如果你想要阻塞等待
		// if err := limiter.Wait(ctxx); err != nil {
		//     return nil, status.Error(codes.Canceled, "等待速率限制时超时或被取消")
		// }
	} else {
		// 如果没有找到对应的速率限制器，可以选择创建一个默认的，或者直接拒绝请求
		return nil, status.Error(codes.Internal, "未配置速率限制器")
	}

	// 在处理请求之前，先记录审计日志的开始部分
	clientVersion := GetClientVersionFromMetadata(ctx)
	auditEntry := map[string]interface{}{
		"timestamp":      time.Now().Format(time.RFC3339),
		"method":         fullName,
		"request":        request, // 记录输入参数
		"client_ip":      clientIP,
		"client_version": clientVersion,
	}

	//认证拦截
	if !extend.AllowWithoutCredential {
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Errorf(codes.Unauthenticated, "failed to parse metadata from incoming context")
		}
		accessTokenStr, err := GetTokenFromMetadata(md)
		if err != nil {
			return nil, status.Error(codes.Unauthenticated, err.Error())
		}

		authContext, err := in.getAuthContext(serverInfo.FullMethod)
		if err != nil {
			return nil, err
		}
		ctx = context.WithValue(ctx, iam.AuthContextKey, authContext)

		if claims, err := in.iamManager.ValidateAccessToken(accessTokenStr); err != nil {
			return nil, err
		} else {
			ctx = context.WithValue(ctx, iam.UserContextKey, claims)

			auditEntry["user_id"] = claims.ID

			if IsAuthenticationAllowed(serverInfo.FullMethod, authContext) {
				if err := ValidateRequestParams(request.(proto.Message)); err != nil {
					return nil, err
				}
				return handler(ctx, request)
			}
		}
	}

	//权限拦截
	if extend.Permission != "" && extend.AuthMethod == v1.AuthMethod_AUTH_METHOD_IAM {
		if ok := in.iamManager.CheckPermission(ctx, auditEntry["user_id"].(int64), extend.Permission); !ok {
			slog.Error("Permission denied", slog.Any("user_id", auditEntry["user_id"]), slog.String("permission", extend.Permission), slog.String("method", fullName))
			return nil, status.Error(codes.PermissionDenied, "permission denied")
		}
	}

	//参数校验拦截
	if err := ValidateRequestParams(request.(proto.Message)); err != nil {
		return nil, err
	}

	// 创建一个通道用于接收结果
	resultChan := make(chan struct {
		res any
		err error
	}, 1)

	// 将任务提交给协程池
	err = in.taskPool.Submit(func() {
		startTime := time.Now()
		res, err := handler(ctx, request)
		duration := time.Since(startTime)

		if extend.Audit {
			// 错误诊断：特别是错误码 14 (UNAVAILABLE)
			if err != nil {
				// 使用诊断工具增强错误信息
				err = in.errorDiagnostic.DiagnoseError(ctx, err, fullName)

				// 记录完整的错误上下文
				in.errorDiagnostic.LogErrorContext(ctx, err, fullName, request, duration)
			}

			auditEntry["status"] = "success"
			if err != nil {
				auditEntry["status"] = "failure"
				auditEntry["error"] = err.Error()
			}
			auditEntry["duration"] = fmt.Sprintf("%dms", duration.Milliseconds())

			attrs := []slog.Attr{
				slog.String("method", fullName),
			}

			// 添加 auditEntry 中的属性
			for k, v := range auditEntry {
				attrs = append(attrs, slog.Any(k, v))
			}

			if err != nil {
				attrs = append(attrs, slog.Any("error", err))

				// 将 []slog.Attr 转换为 []any
				var args []any
				for _, attr := range attrs {
					args = append(args, attr)
				}
				slog.Error("请求处理失败", args...)
			} else {
				// 将 []slog.Attr 转换为 []any
				var args []any
				for _, attr := range attrs {
					args = append(args, attr)
				}
				slog.Info("请求", args...)
			}
		}
		// audit: false 的方法不输出任何日志

		resultChan <- struct {
			res any
			err error
		}{res: res, err: err}
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "无法提交任务到协程池")
	}

	// select 语句监听超时或业务完成
	select {
	case <-ctx.Done():
		// 超时或取消
		return nil, status.Error(codes.DeadlineExceeded, "请求超时：服务器未能完成处理")
	case result := <-resultChan:
		// 业务逻辑完成
		return result.res, result.err
	}
}

// AuthenticationStreamInterceptor is the unary interceptor for gRPC API.
func (in *Interceptor) UnaryServerStreamInterceptor(request any, ss grpc.ServerStream, serverInfo *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
	ctx := ss.Context()
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return status.Errorf(codes.Unauthenticated, "failed to parse metadata from incoming context")
	}
	accessTokenStr, err := GetTokenFromMetadata(md)
	if err != nil {
		return status.Error(codes.Unauthenticated, err.Error())
	}

	authContext, err := in.getAuthContext(serverInfo.FullMethod)
	if err != nil {
		return err
	}
	ctx = context.WithValue(ctx, iam.AuthContextKey, authContext)

	if claims, err := in.iamManager.ValidateAccessToken(accessTokenStr); err != nil {
		return err
	} else {
		ctx = context.WithValue(ctx, iam.UserContextKey, claims)

		if IsAuthenticationAllowed(serverInfo.FullMethod, authContext) {
			sss := overrideStream{ServerStream: ss, childCtx: ctx}
			return handler(request, sss)
		}
	}

	sss := overrideStream{ServerStream: ss, childCtx: ctx}
	return handler(request, sss)
}

type overrideStream struct {
	childCtx context.Context
	grpc.ServerStream
}

func (s overrideStream) Context() context.Context {
	return s.childCtx
}

func GetTokenFromMetadata(md metadata.MD) (string, error) {
	authorizationHeaders := md.Get("Authorization")
	if len(md.Get("Authorization")) > 0 {
		authHeaderParts := strings.Fields(authorizationHeaders[0])
		if len(authHeaderParts) != 2 || strings.ToLower(authHeaderParts[0]) != "bearer" {
			return "", errs.Errorf("authorization header format must be Bearer {token}")
		}
		return authHeaderParts[1], nil
	}
	// check the HTTP cookie
	var accessToken string
	for _, t := range append(md.Get("grpcgateway-cookie"), md.Get("cookie")...) {
		header := http.Header{}
		header.Add("Cookie", t)
		request := http.Request{Header: header}
		if v, _ := request.Cookie(AccessTokenCookieName); v != nil {
			accessToken = v.Value
		}
	}

	return accessToken, nil
}

func GetClientVersionFromMetadata(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ""
	}
	if versions := md.Get("client-version"); len(versions) > 0 {
		return versions[0]
	}
	if versions := md.Get("grpcgateway-client-version"); len(versions) > 0 {
		return versions[0]
	}
	return ""
}

func (in *Interceptor) getAuthContext(fullMethod string) (*iam.AuthContext, error) {
	if extend, ok := in.methoder[fullMethod]; ok {
		am := extend.AuthMethod
		var authMethod iam.AuthMethod

		switch am {
		case v1.AuthMethod_AUTH_METHOD_UNSPECIFIED:
			authMethod = iam.AuthMethodUnspecified
		case v1.AuthMethod_AUTH_METHOD_NONE:
			authMethod = iam.AuthMethodNone
		case v1.AuthMethod_AUTH_METHOD_IAM:
			authMethod = iam.AuthMethodIAM
		}

		return &iam.AuthContext{
			AllowWithoutCredential: extend.AllowWithoutCredential,
			Permission:             extend.Permission,
			AuthMethod:             authMethod,
			Audit:                  extend.Audit,
		}, nil
	} else {
		return nil, errs.Errorf("method %q not found in methoder", fullMethod)
	}
}

func (in *Interceptor) getMethodExtend(fullMethod string) (*v1.MethodExtend, error) {
	extend, ok := in.methoder[fullMethod]
	if !ok {
		return nil, status.Errorf(codes.ResourceExhausted, "method %s is not found", fullMethod)
	}
	return extend, nil
}

// ============== Echo 中间件 ==============

// EchoAuth 为 Echo 路由提供认证中间件
// 用法: e.POST("/upload", handler, interceptor.EchoAuth("file.upload"))
//
//	e.GET("/public", handler, interceptor.EchoAuth("")) // 无权限要求，只认证
func (in *Interceptor) EchoAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			ctx := c.Request().Context()
			ctx = context.WithValue(ctx, iam.UserIPKey, c.RealIP())

			// 提取 Token
			accessToken, err := in.extractTokenFromEcho(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "缺少访问令牌")
			}

			// 验证 Token
			claims, err := in.iamManager.ValidateAccessToken(accessToken)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "无效的访问令牌")
			}

			// 注入用户到上下文
			ctx = context.WithValue(ctx, iam.UserContextKey, claims)
			c.SetRequest(c.Request().WithContext(ctx))

			return next(c)
		}
	}
}

// extractTokenFromEcho 从 Echo 请求中提取 Token
func (in *Interceptor) extractTokenFromEcho(c *echo.Context) (string, error) {
	// 1. Authorization Header
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			return parts[1], nil
		}
	}

	// 2. Cookie
	if cookie, err := c.Cookie(AccessTokenCookieName); err == nil && cookie.Value != "" {
		return cookie.Value, nil
	}

	// 3. Query 参数（备选）
	if token := c.QueryParam("access_token"); token != "" {
		return token, nil
	}

	return "", status.Error(codes.Unauthenticated, "未找到访问令牌")
}
