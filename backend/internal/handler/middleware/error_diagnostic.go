package middleware

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ErrorDiagnostic 提供 gRPC 错误诊断功能
type ErrorDiagnostic struct {
	logger *slog.Logger
}

// NewErrorDiagnostic 创建错误诊断实例
func NewErrorDiagnostic(logger *slog.Logger) *ErrorDiagnostic {
	return &ErrorDiagnostic{
		logger: logger,
	}
}

// DiagnoseError 诊断 gRPC 错误，特别是错误码 14 (UNAVAILABLE)
func (d *ErrorDiagnostic) DiagnoseError(ctx context.Context, err error, fullMethod string) error {
	if err == nil {
		return nil
	}

	st, ok := status.FromError(err)
	if !ok {
		// 不是 gRPC 错误，直接返回
		return err
	}

	// 重点诊断错误码 14 (UNAVAILABLE)
	if st.Code() == codes.Unavailable {
		diagnosis := d.diagnoseUnavailable(ctx, err, fullMethod)
		d.logger.Error("gRPC UNAVAILABLE 错误诊断",
			slog.String("method", fullMethod),
			slog.String("original_error", err.Error()),
			slog.String("diagnosis", diagnosis),
			slog.Any("error_details", st.Details()),
		)

		// 返回增强的错误信息
		return status.Errorf(codes.Unavailable,
			"服务暂时不可用 [方法: %s] - %s (原因: %s)",
			fullMethod, diagnosis, st.Message())
	}

	// 对其他常见错误也进行诊断
	switch st.Code() {
	case codes.DeadlineExceeded:
		d.logger.Warn("gRPC 超时错误",
			slog.String("method", fullMethod),
			slog.String("error", err.Error()),
		)
	case codes.Canceled:
		d.logger.Warn("gRPC 请求被取消",
			slog.String("method", fullMethod),
			slog.String("error", err.Error()),
		)
	case codes.ResourceExhausted:
		d.logger.Warn("gRPC 资源耗尽",
			slog.String("method", fullMethod),
			slog.String("error", err.Error()),
		)
	}

	return err
}

// diagnoseUnavailable 诊断 UNAVAILABLE 错误的具体原因
func (d *ErrorDiagnostic) diagnoseUnavailable(ctx context.Context, err error, fullMethod string) string {
	errMsg := err.Error()
	diagnosis := make([]string, 0)

	// 1. 检查是否是连接被拒绝
	if strings.Contains(errMsg, "connection refused") ||
		strings.Contains(errMsg, "connect: connection refused") {
		diagnosis = append(diagnosis, "连接被拒绝 - 目标服务可能未启动或端口不正确")
	}

	// 2. 检查是否是 DNS 解析失败
	if strings.Contains(errMsg, "no such host") ||
		strings.Contains(errMsg, "dns") ||
		strings.Contains(errMsg, "Name or service not known") {
		diagnosis = append(diagnosis, "DNS解析失败 - 主机名无法解析")
	}

	// 3. 检查是否是网络不可达
	if strings.Contains(errMsg, "network is unreachable") ||
		strings.Contains(errMsg, "no route to host") {
		diagnosis = append(diagnosis, "网络不可达 - 检查网络配置和防火墙")
	}

	// 4. 检查是否是超时
	if strings.Contains(errMsg, "timeout") ||
		strings.Contains(errMsg, "deadline exceeded") ||
		strings.Contains(errMsg, "i/o timeout") {
		diagnosis = append(diagnosis, "连接超时 - 服务响应时间过长或网络延迟高")
	}

	// 5. 检查是否是 TLS/SSL 错误
	if strings.Contains(errMsg, "tls") ||
		strings.Contains(errMsg, "ssl") ||
		strings.Contains(errMsg, "certificate") {
		diagnosis = append(diagnosis, "TLS/SSL错误 - 证书问题或加密配置不匹配")
	}

	// 6. 检查是否是连接重置
	if strings.Contains(errMsg, "connection reset") ||
		strings.Contains(errMsg, "broken pipe") ||
		strings.Contains(errMsg, "EOF") {
		diagnosis = append(diagnosis, "连接重置 - 服务端主动关闭连接或网络中断")
	}

	// 7. 检查是否是端口被占用或不可用
	if strings.Contains(errMsg, "address already in use") {
		diagnosis = append(diagnosis, "地址已被占用 - 端口冲突")
	}

	// 8. 检查上下文是否已取消
	if ctx.Err() == context.Canceled {
		diagnosis = append(diagnosis, "请求被取消 - 客户端主动取消或上游服务中断")
	} else if ctx.Err() == context.DeadlineExceeded {
		diagnosis = append(diagnosis, "上下文超时 - 超过设定的deadline")
	}

	// 9. 检查是否是负载均衡器问题
	if strings.Contains(errMsg, "load balancer") ||
		strings.Contains(errMsg, "resolver") {
		diagnosis = append(diagnosis, "负载均衡/服务发现问题 - 无法找到可用的后端服务")
	}

	// 10. 检查是否是资源耗尽
	if strings.Contains(errMsg, "too many") ||
		strings.Contains(errMsg, "resource exhausted") {
		diagnosis = append(diagnosis, "资源耗尽 - 连接数或其他资源达到上限")
	}

	if len(diagnosis) == 0 {
		diagnosis = append(diagnosis, "未知原因 - 需要进一步检查日志和网络状态")
	}

	return strings.Join(diagnosis, "; ")
}

// CheckServiceHealth 主动检查服务健康状态（可选的辅助功能）
func (d *ErrorDiagnostic) CheckServiceHealth(address string, timeout time.Duration) error {
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		d.logger.Error("服务健康检查失败",
			slog.String("address", address),
			slog.String("error", err.Error()),
		)
		return fmt.Errorf("无法连接到 %s: %w", address, err)
	}
	defer conn.Close()

	d.logger.Info("服务健康检查成功",
		slog.String("address", address),
	)
	return nil
}

// LogErrorContext 记录错误的完整上下文信息
func (d *ErrorDiagnostic) LogErrorContext(
	ctx context.Context,
	err error,
	fullMethod string,
	request interface{},
	duration time.Duration,
) {
	if err == nil {
		return
	}

	st, _ := status.FromError(err)

	d.logger.Error("gRPC 调用失败 - 完整上下文",
		slog.String("method", fullMethod),
		slog.String("error_code", st.Code().String()),
		slog.String("error_message", st.Message()),
		slog.Any("request", request),
		slog.Duration("duration", duration),
		slog.String("client_ip", fmt.Sprintf("%v", ctx.Value("client_ip"))),
		slog.Time("timestamp", time.Now()),
	)
}
