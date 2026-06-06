//go:build wireinject

package app

import (
	"quick_meesage/backend/internal/config"
	"quick_meesage/backend/internal/repository"
	"quick_meesage/backend/internal/service"
	"quick_meesage/backend/internal/storage"
	grpcserver "quick_meesage/backend/internal/transport/grpc"
	httpserver "quick_meesage/backend/internal/transport/http"

	"github.com/google/wire"
)

func Initialize() (*App, func(), error) {
	wire.Build(
		config.New,
		storage.Set,
		repository.Set,
		service.Set,
		httpserver.New,
		grpcserver.New,
		New,
	)
	return nil, nil, nil
}
