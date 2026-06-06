package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"
	"quick_message/backend/internal/conf"
	"syscall"
	"time"

	"golang.org/x/sync/errgroup"
	"gopkg.in/natefinch/lumberjack.v2"
	"gopkg.in/yaml.v3"
)

// 通过 -ldflags 注入的构建信息
var (
	Version   string
	BuildTime string
	GitCommit string
)

var flagconf string

func init() {
	flag.StringVar(&flagconf, "conf", "./configs", "config path, eg: -conf config.yaml")
}

func main() {
	flag.Parse()

	slog.Info("服务启动",
		"version", Version,
		"build_time", BuildTime,
		"git_commit", GitCommit,
	)

	// 读取配置
	raw, err := os.ReadFile(flagconf)
	if err != nil {
		slog.Error("读取配置文件失败", "path", flagconf, "error", err)
		panic(err)
	}

	var cfg conf.Config
	if err := yaml.Unmarshal(raw, &cfg); err != nil {
		slog.Error("解析配置文件失败", "error", err)
		panic(err)
	}

	if cfg.Mode == conf.ReleaseModeProd {
		setupLogger("./logs/backend.log")
	}

	// 初始化数据库
	dbClient, dbCleanup, err := initDataClient(&cfg)
	if err != nil {
		slog.Error("初始化 Data 失败", "error", err)
		return
	}
	defer dbCleanup()

	// 初始化 API 服务
	apiApp, apiCleanup, err := initApiApp(&cfg, dbClient)
	if err != nil {
		slog.Error("初始化 API 失败", "error", err)
		return
	}
	defer apiCleanup()

	// 创建可取消的 context:收到 SIGINT/SIGTERM 时自动取消
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// 用 errgroup 启动 API 服务
	// 任一服务返回 error → 其余服务的 ctx 自动取消 → 全部优雅关停
	g, gCtx := errgroup.WithContext(ctx)

	g.Go(func() error { return apiApp.Run(gCtx) })
	if err := g.Wait(); err != nil {
		slog.Error("服务退出", "error", err)
	}

	slog.Info("程序退出")
}

// setupLogger 生产模式下将日志输出到文件，按天自动轮转，最多保留 180 天
func setupLogger(logFilePath string) {
	if err := os.MkdirAll(filepath.Dir(logFilePath), 0755); err != nil {
		slog.Error("创建日志目录失败", "error", err)
		return
	}

	// 预创建日志文件并设置 644 权限，确保 Alloy 等外部采集器可读
	if f, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644); err == nil {
		f.Close()
	}

	lj := &lumberjack.Logger{
		Filename:   logFilePath,
		MaxSize:    10,   // 单文件上限 10MB（防止极端场景，实际由每日轮转控制）
		MaxAge:     180,  // 保留最近 180 天的日志文件
		MaxBackups: 0,    // 不限备份数量，由 MaxAge 控制清理
		Compress:   true, // 压缩归档旧日志，节省磁盘空间
	}

	slog.SetDefault(slog.New(slog.NewJSONHandler(lj, &slog.HandlerOptions{
		Level:     slog.LevelInfo,
		AddSource: true,
	})))

	// 启动按天轮转协程：每天零点触发 Rotate()，生成新的日志文件
	go func() {
		for {
			now := time.Now()
			// 计算距下一个本地时间零点的等待时长
			nextMidnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
			timer := time.NewTimer(time.Until(nextMidnight))
			<-timer.C
			if err := lj.Rotate(); err != nil {
				slog.Error("日志每日轮转失败", "error", err)
			}
		}
	}()
}
