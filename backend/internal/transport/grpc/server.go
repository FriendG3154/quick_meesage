package grpcserver

import (
	"context"
	"log/slog"
	"time"

	inspirationv1 "quick_meesage/backend/api/gen/inspiration/v1"
	"quick_meesage/backend/internal/service"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health"
	healthv1 "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
)

func New(ideas *service.IdeaService) *grpc.Server {
	server := grpc.NewServer(grpc.ChainUnaryInterceptor(loggingInterceptor))
	inspirationv1.RegisterInspirationServiceServer(server, NewInspirationService(ideas))
	healthv1.RegisterHealthServer(server, health.NewServer())
	return server
}

func loggingInterceptor(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	startedAt := time.Now()
	resp, err := handler(ctx, req)
	slog.Info("grpc request",
		"method", info.FullMethod,
		"duration", time.Since(startedAt).String(),
		"code", status.Code(err).String(),
	)
	if err != nil && status.Code(err) == codes.Unknown {
		return nil, status.Error(codes.Internal, "internal error")
	}
	return resp, err
}
