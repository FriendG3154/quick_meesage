package storage

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"sort"
	"strings"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"quick_meesage/backend/ent"
	"quick_meesage/backend/internal/config"

	"github.com/google/wire"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// NewEntClient 创建一个新的 ent 客户端（用于管理 ent 框架的表）
func NewEntClient(cfg config.Config) (*ent.Client, func(), error) {
	drv, err := entsql.Open(dialect.Postgres, cfg.DatabaseURL)
	if err != nil {
		return nil, nil, err
	}

	client := ent.NewClient(ent.Driver(drv))
	cleanup := func() {
		_ = client.Close()
	}
	return client, cleanup, nil
}

// NewDB 创建一个新的纯 SQL 数据库连接
func NewDB(cfg config.Config) (*sql.DB, func(), error) {
	db, err := sql.Open("pgx", cfg.DatabaseURL)
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

// MigrateSQLTables 执行 schema/sql 目录下的 SQL 迁移文件
func MigrateSQLTables(ctx context.Context, db *sql.DB) error {
	entries, err := sqlMigrations.ReadDir("sql")
	if err != nil {
		return nil
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)
	for _, f := range files {
		content, err := sqlMigrations.ReadFile("sql/" + f)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", f, err)
		}
		if _, err := db.ExecContext(ctx, string(content)); err != nil {
			return fmt.Errorf("exec migration %s: %w", f, err)
		}
	}
	return nil
}

//go:embed sql
var sqlMigrations embed.FS

var Set = wire.NewSet(NewEntClient, NewDB)
