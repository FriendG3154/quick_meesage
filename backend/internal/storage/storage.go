package storage

import (
	"context"
	"database/sql"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"quick_meesage/backend/ent"
	"quick_meesage/backend/internal/config"
	"quick_meesage/backend/schema/migrations"

	"github.com/google/wire"
	_ "modernc.org/sqlite"
)

// NewEntClient 创建一个新的 ent 客户端（用于管理 ent 框架的表）
func NewEntClient(cfg config.Config) (*ent.Client, func(), error) {
	drv, err := entsql.Open(dialect.SQLite, cfg.DatabaseURL)
	if err != nil {
		return nil, nil, err
	}

	client := ent.NewClient(ent.Driver(drv))
	cleanup := func() {
		_ = client.Close()
	}
	return client, cleanup, nil
}

// NewDB 创建一个新的纯 SQL 数据库连接（用于管理 backend/schema 下的表）
func NewDB(cfg config.Config) (*sql.DB, func(), error) {
	db, err := sql.Open("sqlite", cfg.DatabaseURL)
	if err != nil {
		return nil, nil, err
	}
	cleanup := func() {
		_ = db.Close()
	}
	return db, cleanup, nil
}

// Migrate 执行 ent 框架的迁移
func Migrate(ctx context.Context, client *ent.Client) error {
	return client.Schema.Create(ctx)
}

// MigrateSQLTables 执行 backend/schema 下的纯 SQL 迁移
func MigrateSQLTables(ctx context.Context, db *sql.DB) error {
	return migrations.CreateAllTables(db)
}

var Set = wire.NewSet(NewEntClient, NewDB)
