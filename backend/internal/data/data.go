package data

import (
	"database/sql"
	"fmt"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"github.com/google/wire"

	// pgx 驱动以 "pgx" 名注册到 database/sql
	_ "github.com/jackc/pgx/v5/stdlib"

	"quick_message/backend/ent"
	"quick_message/backend/internal/conf"
)

// Client 是 ent.Client 的别名,让 wire 的签名读起来更自然。
type Client = ent.Client

// WireSet 暴露构造函数给 wire。
var WireSet = wire.NewSet(NewClient)

// NewClient 用 pgx 连接 Postgres,封装成 ent.Client。
// 启动时 Ping 一次,DSN/网络/凭据有问题立即暴露。
func NewClient(c *conf.Config) (*ent.Client, func(), error) {
	db, err := sql.Open("pgx", c.Database.Dsn)
	if err != nil {
		return nil, nil, fmt.Errorf("open postgres: %w", err)
	}
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, nil, fmt.Errorf("ping postgres: %w", err)
	}
	drv := entsql.OpenDB(dialect.Postgres, db)
	client := ent.NewClient(ent.Driver(drv))
	cleanup := func() {
		_ = client.Close()
	}
	return client, cleanup, nil
}
