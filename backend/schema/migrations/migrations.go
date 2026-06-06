package migrations

import (
	"database/sql"

	"quick_meesage/backend/schema"
)

// CreateAllTables 创建所有数据库表
func CreateAllTables(db *sql.DB) error {
	migrations := []struct {
		name string
		fn   func(*sql.DB) error
	}{
		{"create_auth", schema.MigrateAuth},
		{"create_user", schema.MigrateUser},
		{"create_message", schema.MigrateMessage},
		{"create_pic", schema.MigratePic},
		{"create_voice", schema.MigrateVoice},
		{"create_trash", schema.MigrateTrash},
	}

	for _, m := range migrations {
		if err := m.fn(db); err != nil {
			return err
		}
	}
	return nil
}