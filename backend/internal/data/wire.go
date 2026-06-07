package data

import (
	"quick_message/backend/internal/data/repoiface"

	"github.com/google/wire"
)

var WireSet = wire.NewSet(
	NewSnowflakeNode,
	NewRedisClient,
	NewSQLDB,
	NewEntClient,
	NewDBProvider,
	NewCache,
	NewLocker,
	NewIDGenerator,
	NewSequencer,
	NewQueryHelper,
	repoiface.NewBase,
	wire.Bind(new(repoiface.DBProvider), new(*DBProvider)),
	wire.Bind(new(repoiface.IDGenerator), new(*IDGenerator)),
	wire.Bind(new(repoiface.Sequencer), new(*Sequencer)),
	wire.Bind(new(repoiface.Locker), new(*Locker)),
	wire.Bind(new(repoiface.Cache), new(*Cache)),
	wire.Bind(new(repoiface.QueryHelper), new(*QueryHelper)),

	wire.Struct(new(Client), "*"),
)
