package schema

import (
	"database/sql"
	"fmt"
)

const createVoiceTable = `
CREATE TABLE IF NOT EXISTS "voice" (
	"id" VARCHAR(255) NOT NULL,
	"user_id" VARCHAR(255),
	"url" VARCHAR(255),
	"remark" VARCHAR(255),
	"content" TEXT,
	PRIMARY KEY("id")
);
`

// Voice 定义音频表结构
type Voice struct {
	ID      string // 音频ID
	UserID  string // 用户ID
	URL     string // 音频文件地址
	Remark  string // 音频备注
	Content string // 音频转文字结果
}

// MigrateVoice 创建音频表
func MigrateVoice(db *sql.DB) error {
	_, err := db.Exec(createVoiceTable)
	return err
}

// ScanVoice 从数据库行扫描 Voice
func ScanVoice(row interface {
	Scan(...interface{}) error
}) (*Voice, error) {
	var v Voice
	err := row.Scan(&v.ID, &v.UserID, &v.URL, &v.Remark, &v.Content)
	if err != nil {
		return nil, fmt.Errorf("scan voice: %w", err)
	}
	return &v, nil
}