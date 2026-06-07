package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"mdzf-jiajuguan/backend/pkg/apierr"

	"google.golang.org/grpc/codes"

	grpcruntime "github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
)

// grpcCodeToHTTPStatus 将 gRPC 状态码映射为 HTTP 状态码
func grpcCodeToHTTPStatus(c codes.Code) int {
	switch c {
	case codes.OK:
		return http.StatusOK
	case codes.Canceled:
		return http.StatusRequestTimeout // 499 Client Closed Request → 408
	case codes.InvalidArgument:
		return http.StatusBadRequest
	case codes.NotFound:
		return http.StatusNotFound
	case codes.AlreadyExists:
		return http.StatusConflict
	case codes.PermissionDenied:
		return http.StatusForbidden
	case codes.Unauthenticated:
		return http.StatusUnauthorized
	case codes.ResourceExhausted:
		return http.StatusTooManyRequests
	case codes.FailedPrecondition:
		return http.StatusBadRequest // 前置条件不满足 → 400
	case codes.Aborted:
		return http.StatusConflict
	case codes.OutOfRange:
		return http.StatusBadRequest
	case codes.Unimplemented:
		return http.StatusNotImplemented
	case codes.DeadlineExceeded:
		return http.StatusGatewayTimeout
	case codes.Unavailable:
		return http.StatusServiceUnavailable
	case codes.DataLoss:
		return http.StatusInternalServerError
	default: // Internal, Unknown, etc.
		return http.StatusInternalServerError
	}
}

// CustomHTTPErrorHandler 替换 grpc-gateway 默认的错误序列化逻辑，
// 将 gRPC error 转为结构化的 apiErrorResponse JSON。
//
// 用法（在 grpcruntime.NewServeMux 中）:
//
//	grpcruntime.NewServeMux(
//	    grpcruntime.WithErrorHandler(middleware.CustomHTTPErrorHandler),
//	    ...
//	)
func CustomHTTPErrorHandler(ctx context.Context, mux *grpcruntime.ServeMux, marshaler grpcruntime.Marshaler, w http.ResponseWriter, r *http.Request, err error) {
	resp := apierr.NewPublicErrorResponse(strings.TrimSpace(err.Error()), "server_error", "internal_error", nil)
	httpStatus := http.StatusInternalServerError

	if publicError, grpcCode, ok := apierr.PublicErrorFromError(err); ok {
		resp = apierr.PublicErrorResponse{Error: publicError}
		httpStatus = grpcCodeToHTTPStatus(grpcCode)
	}

	body, marshalErr := json.Marshal(resp)
	if marshalErr != nil {
		// 极端情况：JSON 序列化失败，返回硬编码的错误 JSON
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = fmt.Fprintf(w, `{"error":{"message":"序列化错误响应失败","type":"server_error","param":null,"code":"internal_error"}}`)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)
	_, _ = w.Write(body)
}
