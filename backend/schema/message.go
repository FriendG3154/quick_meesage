package schema

import (
	"database/sql"
	"fmt"
)

const createMessageTable = `
CREATE TABLE IF NOT EXISTS "message" (
	"id" VARCHAR(255) NOT NULL UNIQUE,
	"user_id" VARCHAR(255),
	"content" TEXT,
	"delete" BOOLEAN,
	PRIMARY KEY("id")
);
`

// Message 定义消息表结构
type Message struct {
	ID      string // 消息ID
	UserID  string // 用户ID
	Content string // 表单内容
	Delete  bool   // 是否删除
}

// MigrateMessage 创建消息表
func MigrateMessage(db *sql.DB) error {
	_, err := db.Exec(createMessageTable)
	return err
}

// ScanMessage 从数据库行扫描 Message
func ScanMessage(row interface {
	Scan(...interface{}) error
}) (*Message, error) {
	var m Message
	err := row.Scan(&m.ID, &m.UserID, &m.Content, &m.Delete)
	if err != nil {
		return nil, fmt.Errorf("scan message: %w", err)
	}
	return &m, nil
}