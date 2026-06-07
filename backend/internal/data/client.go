package data

import "quick_message/backend/internal/data/repoiface"

// Client 组合了所有领域 Repo，是 Service 层的唯一依赖。
// 通过组合独立能力对象，Client 本身保留事务、缓存、锁、ID、序号等入口，
// 使跨 Repo 的事务操作可以直接通过 Client 发起。
type Client struct {
	*repoiface.Base
}

// Close 关闭数据库和 Redis 连接，应在程序退出时调用。
func (c *Client) Close() error {
	return c.Base.Close()
}
