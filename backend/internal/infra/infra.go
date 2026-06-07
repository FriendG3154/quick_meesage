package infra

import (
	"log/slog"

	"quick_message/backend/internal/conf"
	"quick_message/backend/internal/data"
	"quick_message/backend/pkg/wechat"

	"github.com/google/wire"
	"github.com/redis/go-redis/v9"
)

// Infra 聚合所有外部服务客户端，供 Service 层统一依赖注入。
type Infra struct {
	Wechat *wechat.Client
}

// NewInfra 构造 Infra，统一初始化所有外部依赖。
func NewInfra(cfg *conf.Config, dbClient *data.Client, rdb *redis.Client) *Infra {
	wechatClient := wechat.NewClient(cfg.Wechat.AppID, cfg.Wechat.AppSecret, rdb)
	if wechatClient == nil {
		slog.Error("初始化微信客户端失败")
	} else {
		slog.Info("微信客户端初始化成功")
	}

	return &Infra{
		Wechat: wechatClient,
	}
}

var WireSet = wire.NewSet(NewInfra)
