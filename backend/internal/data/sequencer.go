package data

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// Sequencer 基于 Redis INCR 生成业务序号。
//   - NextNo: 形如 "{prefix}{yyyyMMdd}{6位递增}"，按天分键
//   - NextShortNo: 形如 "{yyyyMMddHHmmss}{4位递增}"，按秒分键
type Sequencer struct {
	rdb *redis.Client
}

func NewSequencer(rdb *redis.Client) *Sequencer {
	return &Sequencer{rdb: rdb}
}

func (s *Sequencer) NextNo(ctx context.Context, prefix, redisKeyPrefix string) (string, error) {
	day := time.Now().Format("20060102")
	seqKey := fmt.Sprintf("%s:%s:%s", redisKeyPrefix, "no", day)
	n, err := s.rdb.Incr(ctx, seqKey).Result()
	if err != nil {
		return "", fmt.Errorf("incr seq: %w", err)
	}
	// 仅在第一次 INCR 时设置当天过期
	if n == 1 {
		_ = s.rdb.Expire(ctx, seqKey, 48*time.Hour).Err()
	}
	return fmt.Sprintf("%s%s%06d", prefix, day, n), nil
}

func (s *Sequencer) NextShortNo(ctx context.Context, redisKeyPrefix string) (string, error) {
	sec := time.Now().Format("20060102150405")
	seqKey := fmt.Sprintf("%s:%s:%s", redisKeyPrefix, "short", sec)
	n, err := s.rdb.Incr(ctx, seqKey).Result()
	if err != nil {
		return "", fmt.Errorf("incr short seq: %w", err)
	}
	if n == 1 {
		_ = s.rdb.Expire(ctx, seqKey, 5*time.Minute).Err()
	}
	return sec + leftPad(strconv.FormatInt(n, 10), 4), nil
}

func leftPad(s string, n int) string {
	for len(s) < n {
		s = "0" + s
	}
	return s
}
