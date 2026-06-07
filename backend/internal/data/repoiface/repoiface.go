package repoiface

import (
	"context"
	"errors"
	"time"

	"quick_message/backend/ent"

	"entgo.io/ent/dialect/sql"
	"github.com/redis/go-redis/v9"
)

type DBProvider interface {
	GetClient(ctx context.Context) *ent.Client
	Close() error
	WithTxOptions(ctx context.Context, opts *TxOptions, maxRetries int, fn TxFuncWithContext) error
}

type IDGenerator interface {
	GetID(ctx context.Context) int64
}

type Sequencer interface {
	NextNo(ctx context.Context, prefix, redisKeyPrefix string) (string, error)
	NextShortNo(ctx context.Context, redisKeyPrefix string) (string, error)
}

type Locker interface {
	AcquireLock(ctx context.Context, key string, expiration time.Duration) error
}

type Cache interface {
	Get(ctx context.Context, key string) *redis.StringCmd
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) *redis.StatusCmd
	TTL(ctx context.Context, key string) *redis.DurationCmd
	Exists(ctx context.Context, key string) bool
	Delete(ctx context.Context, key string) error
	Pipeline() redis.Pipeliner
	ExistsCount(ctx context.Context, key string) (int64, error)
	Rename(ctx context.Context, key, newKey string) error
	HMGet(ctx context.Context, key string, fields ...string) ([]interface{}, error)
	Close() error
}

type TxOptions struct {
	Isolation int
	ReadOnly  bool
}

type TxFuncWithContext func(ctx context.Context) error

type QueryHelper interface {
	ApplyPagination(pageNum, pageSize int32) (int, int, bool)
	BuildSortOptions(sorts []string, validColumn func(string) bool, defaultField string) ([]func(*sql.Selector), error)
	ParseFieldMask(paths []string, validColumn func(string) bool, allColumns []string) ([]string, error)
}

type ListQueryOptions struct {
	PageNum      int32
	PageSize     int32
	Sorts        []string
	ValidColumn  func(string) bool
	DefaultField string
	MaskPaths    []string
	AllColumns   []string
}

type ListQueryApplier struct {
	ApplyPagination func(offset, limit int)
	ApplyOrder      func(opt func(*sql.Selector))
	ApplySelect     func(fields ...string)
}

func ApplyListQueryOptions(queryHelper QueryHelper, options ListQueryOptions, applier ListQueryApplier) error {
	if offset, limit, ok := queryHelper.ApplyPagination(options.PageNum, options.PageSize); ok {
		applier.ApplyPagination(offset, limit)
	}

	sortOpts, err := queryHelper.BuildSortOptions(options.Sorts, options.ValidColumn, options.DefaultField)
	if err != nil {
		return err
	}
	for _, opt := range sortOpts {
		applier.ApplyOrder(opt)
	}

	fields, err := queryHelper.ParseFieldMask(options.MaskPaths, options.ValidColumn, options.AllColumns)
	if err != nil {
		return err
	}
	applier.ApplySelect(fields...)

	return nil
}

type Base struct {
	DBProvider
	IDGenerator
	Sequencer
	Locker
	Cache
	QueryHelper
}

func NewBase(
	dbProvider DBProvider,
	idGenerator IDGenerator,
	sequencer Sequencer,
	locker Locker,
	cache Cache,
	queryHelper QueryHelper,
) *Base {
	return &Base{
		DBProvider:  dbProvider,
		IDGenerator: idGenerator,
		Sequencer:   sequencer,
		Locker:      locker,
		Cache:       cache,
		QueryHelper: queryHelper,
	}
}

func (b *Base) Close() error {
	if b == nil {
		return nil
	}
	return errors.Join(b.DBProvider.Close(), b.Cache.Close())
}
