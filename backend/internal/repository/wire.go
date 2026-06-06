package repository

import (
	"quick_meesage/backend/internal/service"

	"github.com/google/wire"
)

var Set = wire.NewSet(
	NewIdeaRepository,
	wire.Bind(new(service.IdeaRepository), new(*IdeaRepository)),
)
