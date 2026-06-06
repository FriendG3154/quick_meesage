package schema

import (
	"database/sql"
	"fmt"
	"sort"
)

// Migration 表示一个数据库迁移
type Migration struct {
	// Version 迁移版本号
	Version int
	// Name 迁移名称
	Name string
	// Up 执行迁移的函数
	Up func(*sql.DB) error
}

// migrations 按版本号排序
var migrations []Migration

// Register 注册迁移
func Register(version int, name string, up func(*sql.DB) error) {
	migrations = append(migrations, Migration{
		Version: version,
		Name:    name,
		Up:      up,
	})
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})
}

// MigrateUp 执行所有未应用的迁移
func MigrateUp(db *sql.DB) error {
	// 按顺序执行所有迁移
	for _, m := range migrations {
		if err := m.Up(db); err != nil {
			return fmt.Errorf("migration %s (v%d): %w", m.Name, m.Version, err)
		}
	}
	return nil
}

// AllTables 所有表的迁移函数
func AllTables() {
	Register(1, "create_auth", MigrateAuth)
	Register(2, "create_user", MigrateUser)
	Register(3, "create_message", MigrateMessage)
	Register(4, "create_pic", MigratePic)
	Register(5, "create_voice", MigrateVoice)
	Register(6, "create_trash", MigrateTrash)
}

// GetMigrations 返回所有迁移
func GetMigrations() []Migration {
	return migrations
}