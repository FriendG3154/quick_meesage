package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Auth struct{ ent.Schema }

func (Auth) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Table("auth"),
		entsql.WithComments(true),
	}
}

func (Auth) Fields() []ent.Field {
	return []ent.Field{
		field.Int("id").Positive().Immutable(),
		field.String("name").Optional().MaxLen(255).Comment("会员名称"),
		field.Bool("voice_message").Optional().Comment("音频转文字权限"),
		field.Int("trash").Optional().Comment("垃圾箱最多保留时间非会员7天,会员30天"),
	}
}

func (Auth) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("users", User.Type),
	}
}
