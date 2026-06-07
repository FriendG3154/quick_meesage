//go:build wireinject
// +build wireinject

package main

import (
	"quick_message/backend/internal/conf"
	"quick_message/backend/internal/data"
	"quick_message/backend/internal/handler"
	infraPkg "quick_message/backend/internal/infra"
	"quick_message/backend/internal/server"

	// "quick_message/backend/internal/service"

	"github.com/google/wire"
)

func initDataClient(conf *conf.Config) (*data.Client, func(), error) {
	panic(wire.Build(data.WireSet))
}

func initApiApp(conf *conf.Config, dbClient *data.Client) (*server.ApiServer, func(), error) {
	panic(wire.Build(handler.WireSet, infraPkg.WireSet, server.NewHandlerServer))
}
