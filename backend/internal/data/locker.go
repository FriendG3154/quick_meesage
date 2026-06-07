package data

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrLockBusy = errors.New("data: lock busy")

type Locker struct {
	client *redis.Client
}

func NewLocker(rdb *redis.Client) *Locker {
	return &Locker{client: rdb}
}

func (l *Locker) AcquireLock(ctx context.Context, key string, expiration time.Duration) error {
	if !l.client.SetNX(ctx, key, "locked", expiration).Val() {
		return ErrLockBusy
	}
	return nil
}

func IsLockBusy(err error) bool {
	return errors.Is(err, ErrLockBusy)
}
