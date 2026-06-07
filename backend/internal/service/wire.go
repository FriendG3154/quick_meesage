package service

import (
	wechatsvc "quick_message/backend/internal/service/wechat"

	"github.com/google/wire"
)

var WireSet = wire.NewSet(
	wechatsvc.NewService,
)
