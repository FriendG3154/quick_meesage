package data

import (
	"context"
	"database/sql"

	"quick_message/backend/ent"
	entmigrate "quick_message/backend/ent/migrate"
	"quick_message/backend/internal/conf"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/schema"
	"github.com/bwmarrin/snowflake"
	"github.com/redis/go-redis/v9"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewSnowflakeNode() (*snowflake.Node, error) {
	return snowflake.NewNode(1)
}

func NewRedisClient(conf *conf.Config) (*redis.Client, error) {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: conf.Redis.Addr})
	if err := rdb.Ping(ctx).Err(); err != nil {
		_ = rdb.Close()
		return nil, err
	}
	return rdb, nil
}

func NewSQLDB(conf *conf.Config) (*sql.DB, error) {
	db, err := sql.Open("pgx", conf.Database.Dsn)
	if err != nil {
		return nil, err
	}
	return db, nil
}

func NewEntClient(db *sql.DB) (*ent.Client, error) {
	entDriver := entsql.OpenDB(dialect.Postgres, db)
	client := ent.NewClient(ent.Driver(entDriver))
	if err := MigrateSchema(
		context.Background(),
		client,
		entmigrate.WithDropIndex(false),
		entmigrate.WithDropColumn(false),
	); err != nil {
		_ = client.Close()
		return nil, err
	}
	return client, nil
}

func MigrateSchema(ctx context.Context, client *ent.Client, opts ...schema.MigrateOption) error {
	if ctx == nil {
		ctx = context.Background()
	}
	return client.Schema.Create(ctx, opts...)
}
