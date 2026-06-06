package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Voice struct{ ent.Schema }

func (Voice) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("voice")}
}

func (Voice) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").MaxLen(255).NotEmpty().Immutable(),
		field.String("user_id").Optional().MaxLen(255),
		field.String("url").Optional().MaxLen(255).Comment("音频文件地址"),
		field.String("remark").Optional().MaxLen(255).Comment("音频备注"),
		field.String("content").Optional().Comment("音频文字转换结果"),
	}
}

func (Voice) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("voices").
			Field("user_id").
			Unique(),
	}
}
