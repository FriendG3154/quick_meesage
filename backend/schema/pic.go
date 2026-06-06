package schema

import (
	"database/sql"
	"fmt"
)

const createPicTable = `
CREATE TABLE IF NOT EXISTS "pic" (
	"id" VARCHAR(255) NOT NULL,
	"uesr_id" VARCHAR(255),
	"picUrl" VARCHAR(255),
	"pid" VARCHAR(255),
	"remake" TEXT,
	PRIMARY KEY("id")
);
CREATE INDEX IF NOT EXISTS "pic_index_0" ON "pic" ("id");
`

// Pic 定义图片表结构
type Pic struct {
	ID string // 用户图片ID
	UserID string // 用户ID
	PicUrl string // 图片URL
	PID    string // 父节点ID
	Remake string // 备注
}

// MigratePic 创建图片表
func MigratePic(db *sql.DB) error {
	_, err := db.Exec(createPicTable)
	return err
}

// ScanPic 从数据库行扫描 Pic
func ScanPic(row interface {
	Scan(...interface{}) error
}) (*Pic, error) {
	var p Pic
	err := row.Scan(&p.ID, &p.UserID, &p.PicUrl, &p.PID, &p.Remake)
	if err != nil {
		return nil, fmt.Errorf("scan pic: %w", err)
	}
	return &p, nil
}