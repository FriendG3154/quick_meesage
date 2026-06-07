package middleware

import (
	"errors"

	"buf.build/go/protovalidate"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

type ParamErrorInfo struct {
	Field   string `json:"field"`
	Message any    `json:"message"`
	RuleID  any    `json:"rule_id"`
}

func (e *ParamErrorInfo) Reset() {
}

func (e *ParamErrorInfo) String() string {
	return e.Message.(string)
}

func (e *ParamErrorInfo) ProtoMessage() {

}

func ValidateRequestParams(msg proto.Message) error {
	//参数校验拦截
	errs := make([]ParamErrorInfo, 0)
	if err := protovalidate.Validate(msg); err != nil {
		var valErr *protovalidate.ValidationError
		if ok := errors.As(err, &valErr); ok {
			for _, violation := range valErr.Violations {
				e := ParamErrorInfo{
					Field:   protovalidate.FieldPathString(violation.Proto.GetField()),
					Message: *violation.Proto.Message,
					RuleID:  *violation.Proto.RuleId,
				}

				errs = append(errs, e)

				/*
					{FieldName:name Message:名称长度不可超过10 RuleID:1}
					{FieldName:age Message:年龄必须在1到150之间 RuleID:1}
				*/
			}
		}

	}
	if len(errs) > 0 {
		// 1. 创建一个 BadRequest 错误细节消息
		badRequest := &errdetails.BadRequest{
			FieldViolations: []*errdetails.BadRequest_FieldViolation{},
		}
		for _, e := range errs {
			// 这里可以添加多个错误细节
			badRequest.FieldViolations = append(badRequest.FieldViolations, &errdetails.BadRequest_FieldViolation{
				Field:       e.Field,
				Description: e.Message.(string),
				Reason:      e.RuleID.(string),
			})
		}

		// 2. 创建一个 gRPC 状态，并用 WithDetails 填充
		st := status.New(codes.InvalidArgument, errs[0].Message.(string))
		st, err := st.WithDetails(badRequest)
		if err != nil {
			return status.Error(codes.Internal, "无法添加错误细节")
		}

		// 3. 将 gRPC 状态转换为 Go 错误并返回
		return st.Err()
	}
	return nil
}
