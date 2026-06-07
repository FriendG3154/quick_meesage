package data

import (
	"context"

	"github.com/bwmarrin/snowflake"
)

// IDGenerator 只负责全局 ID 生成。
type IDGenerator struct {
	node *snowflake.Node
}

func NewIDGenerator(node *snowflake.Node) *IDGenerator {
	return &IDGenerator{node: node}
}

func (g *IDGenerator) GetID(context.Context) int64 {
	return g.node.Generate().Int64()
}
