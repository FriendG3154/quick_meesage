package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"mdzf-jiajuguan/backend/pkg/apierr"
	v1 "mdzf-jiajuguan/proto/generated-go/v1"

	grpcruntime "github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestCustomHTTPErrorHandler_BusinessError(t *testing.T) {
	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/v1/orders/1", nil)

	CustomHTTPErrorHandler(
		context.Background(),
		grpcruntime.NewServeMux(),
		&grpcruntime.JSONPb{},
		recorder,
		req,
		apierr.New(v1.ErrorCode_ERROR_CODE_ORDER_NOT_FOUND),
	)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusNotFound)
	}

	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("解析响应失败: %v", err)
	}

	errorObject, ok := body["error"].(map[string]any)
	if !ok {
		t.Fatalf("响应缺少 error 对象: %#v", body)
	}
	if errorObject["code"] != "order_not_found" {
		t.Fatalf("error.code = %#v, want %q", errorObject["code"], "order_not_found")
	}
	if errorObject["type"] != "not_found_error" {
		t.Fatalf("error.type = %#v, want %q", errorObject["type"], "not_found_error")
	}
	if errorObject["message"] != "订单不存在" {
		t.Fatalf("error.message = %#v, want %q", errorObject["message"], "订单不存在")
	}
	if _, exists := body["grpcCode"]; exists {
		t.Fatal("响应不应再暴露 grpcCode")
	}
}

func TestCustomHTTPErrorHandler_GenericGRPCError(t *testing.T) {
	recorder := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/test", nil)

	CustomHTTPErrorHandler(
		context.Background(),
		grpcruntime.NewServeMux(),
		&grpcruntime.JSONPb{},
		recorder,
		req,
		status.Error(codes.InvalidArgument, "参数错误"),
	)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}

	var resp apierr.PublicErrorResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &resp); err != nil {
		t.Fatalf("解析响应失败: %v", err)
	}
	if resp.Error.Code != "invalid_param" {
		t.Fatalf("error.code = %q, want %q", resp.Error.Code, "invalid_param")
	}
	if resp.Error.Type != "invalid_request_error" {
		t.Fatalf("error.type = %q, want %q", resp.Error.Type, "invalid_request_error")
	}
	if resp.Error.Message != "参数错误" {
		t.Fatalf("error.message = %q, want %q", resp.Error.Message, "参数错误")
	}
	if resp.Error.Param != nil {
		t.Fatal("error.param 应为 nil")
	}
}
