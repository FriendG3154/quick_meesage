package data

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"quick_message/backend/ent"
	"quick_message/backend/internal/data/repoiface"

	"github.com/jackc/pgx/v5/pgconn"
)

type txKey struct{}

// ContextWithTx 将 *ent.Tx 存储到 Context 中。
func ContextWithTx(ctx context.Context, tx *ent.Tx) context.Context {
	return context.WithValue(ctx, txKey{}, tx)
}

// IsolationLevel 是 database/sql 中定义的事务隔离级别类型，例如：
// sql.LevelReadUncommitted, sql.LevelReadCommitted, sql.LevelRepeatableRead, sql.LevelSerializable
// MaxRetries 是重试函数的新参数
const DefaultMaxRetries = 3

// PostgreSQL 定义的可重试 SQLSTATE 码
const (
	// 40001: 串行化失败 (Serialization Failure) - 可重试
	SQLStateSerializationFailure = "40001"
	// 40P01: 死锁检测 (Deadlock Detected) - 可重试
	SQLStateDeadlockDetected = "40P01"
)

// DBProvider 只负责数据库客户端与事务上下文切换。
type DBProvider struct {
	db *ent.Client
}

func NewDBProvider(db *ent.Client) *DBProvider {
	return &DBProvider{db: db}
}

// GetClient 检查 Context，决定返回事务客户端还是根客户端。
func (p *DBProvider) GetClient(ctx context.Context) *ent.Client {
	if tx, ok := ctx.Value(txKey{}).(*ent.Tx); ok {
		return tx.Client()
	}
	return p.db
}

func (r *DBProvider) runTxAttempt(
	ctx context.Context,
	sqlOpts *sql.TxOptions,
	fn repoiface.TxFuncWithContext,
) (err error) {
	tx, err := r.db.BeginTx(ctx, sqlOpts)
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}

	txCtx := ContextWithTx(ctx, tx)

	defer func() {
		if recovered := recover(); recovered != nil {
			rollbackOnPanic(tx, recovered)
		}

		if err != nil {
			err = rollbackOnError(tx, err)
			return
		}

		if commitErr := tx.Commit(); commitErr != nil {
			err = commitErr
		}
	}()

	err = fn(txCtx)
	return err
}

// WithTxOptions (最终增强版)
// 增加了 maxRetries 参数来控制事务重试次数。
func (r *DBProvider) WithTxOptions(
	ctx context.Context,
	opts *repoiface.TxOptions,
	maxRetries int, // 新参数：最大重试次数
	fn repoiface.TxFuncWithContext,
) error {
	if maxRetries <= 0 {
		maxRetries = DefaultMaxRetries
	}

	// 转换为标准的 sql.TxOptions
	sqlOpts := &sql.TxOptions{}
	if opts != nil {
		sqlOpts.Isolation = sql.IsolationLevel(opts.Isolation)
		sqlOpts.ReadOnly = opts.ReadOnly
	}

	if err := ctx.Err(); err != nil {
		return err
	}

	var lastErr error

	for i := 0; i < maxRetries; i++ {
		attemptErr := r.runTxAttempt(ctx, sqlOpts, fn)
		if attemptErr == nil {
			return nil
		}
		lastErr = attemptErr

		if reason, ok := retryableErrorReason(attemptErr); ok && i < maxRetries-1 {
			slog.Warn("transaction retryable failure",
				slog.String("reason", reason),
				slog.Int("attempt", i+1),
				slog.Int("max_retries", maxRetries),
				slog.Any("error", attemptErr),
			)
			if err := waitRetry(ctx, i+1); err != nil {
				return err
			}
			continue
		}

		return attemptErr
	}

	return fmt.Errorf("transaction failed after %d retries: %w", maxRetries, lastErr)
}

func (p *DBProvider) Close() error {
	if p == nil || p.db == nil {
		return nil
	}
	if err := p.db.Close(); err != nil {
		return fmt.Errorf("close db: %w", err)
	}
	return nil
}

func JoinCloseErrors(errs ...error) error {
	filtered := make([]error, 0, len(errs))
	for _, err := range errs {
		if err != nil {
			filtered = append(filtered, err)
		}
	}
	if len(filtered) == 0 {
		return nil
	}
	return errors.Join(filtered...)
}

func retryableErrorReason(err error) (string, bool) {
	if err == nil {
		return "", false
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.SQLState() {
		case SQLStateSerializationFailure:
			return SQLStateSerializationFailure, true
		case SQLStateDeadlockDetected:
			return SQLStateDeadlockDetected, true
		}
	}

	return "", false
}

func waitRetry(ctx context.Context, attempt int) error {
	backoff := 50 * time.Millisecond
	for i := 1; i < attempt; i++ {
		backoff *= 2
		if backoff >= 500*time.Millisecond {
			backoff = 500 * time.Millisecond
			break
		}
	}

	timer := time.NewTimer(backoff)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func rollbackOnError(tx *ent.Tx, err error) error {
	if err == nil {
		return nil
	}

	rbErr := tx.Rollback()
	if rbErr == nil || errors.Is(rbErr, sql.ErrTxDone) {
		return err
	}

	return fmt.Errorf("tx rollback failed: %v, original error: %w", rbErr, err)
}

func rollbackOnPanic(tx *ent.Tx, recovered any) {
	if rbErr := tx.Rollback(); rbErr != nil && !errors.Is(rbErr, sql.ErrTxDone) {
		slog.Error("transaction rollback after panic failed", slog.Any("error", rbErr))
	}
	panic(recovered)
}
