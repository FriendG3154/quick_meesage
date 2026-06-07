package data

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache 只负责 Redis 基础读写能力。
type Cache struct {
	rdb *redis.Client
}

func NewCache(rdb *redis.Client) *Cache {
	return &Cache{rdb: rdb}
}

func (c *Cache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) *redis.StatusCmd {
	return c.rdb.Set(ctx, key, value, expiration)
}

func (c *Cache) Get(ctx context.Context, key string) *redis.StringCmd {
	return c.rdb.Get(ctx, key)
}

func (c *Cache) TTL(ctx context.Context, key string) *redis.DurationCmd {
	return c.rdb.TTL(ctx, key)
}

func (c *Cache) Exists(ctx context.Context, key string) bool {
	return c.rdb.Exists(ctx, key).Val() > 0
}

func (c *Cache) Delete(ctx context.Context, key string) error {
	return c.rdb.Del(ctx, key).Err()
}

func (c *Cache) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) bool {
	return c.rdb.SetNX(ctx, key, value, expiration).Val()
}

func (c *Cache) Pipeline() redis.Pipeliner {
	return c.rdb.Pipeline()
}

func (c *Cache) ExistsCount(ctx context.Context, key string) (int64, error) {
	return c.rdb.Exists(ctx, key).Result()
}

func (c *Cache) Rename(ctx context.Context, key, newKey string) error {
	return c.rdb.Rename(ctx, key, newKey).Err()
}

func (c *Cache) HMGet(ctx context.Context, key string, fields ...string) ([]interface{}, error) {
	return c.rdb.HMGet(ctx, key, fields...).Result()
}

func (c *Cache) Close() error {
	if c == nil || c.rdb == nil {
		return nil
	}
	if err := c.rdb.Close(); err != nil {
		return fmt.Errorf("close redis: %w", err)
	}
	return nil
}
