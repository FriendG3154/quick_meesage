package schema

import (
	"database/sql"
	"fmt"
)

const createUserTable = `
CREATE TABLE IF NOT EXISTS "user" (
	"id" VARCHAR(255) NOT NULL,
	"wx_openid" VARCHAR(255),
	"phone" VARCHAR(255),
	"wx_name" VARCHAR(255),
	"role_type" INTEGER,
	PRIMARY KEY("id")
);
CREATE INDEX IF NOT EXISTS "user_index_0" ON "user" ("id");
`

// User 定义用户表结构
type User struct {
	ID string // 用户ID (VARCHAR)
	WxOpenid string // 微信OpenID
	Phone   string // 手机号
	WxName  string // 微信名称
	RoleType int   // 角色类型 (关联 auth 表)
}

// MigrateUser 创建用户表
func MigrateUser(db *sql.DB) error {
	_, err := db.Exec(createUserTable)
	return err
}

// ScanUser 从数据库行扫描 User
func ScanUser(row interface {
	Scan(...interface{}) error
}) (*User, error) {
	var u User
	err := row.Scan(&u.ID, &u.WxOpenid, &u.Phone, &u.WxName, &u.RoleType)
	if err != nil {
		return nil, fmt.Errorf("scan user: %w", err)
	}
	return &u, nil
}