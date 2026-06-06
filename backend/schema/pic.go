package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Pic struct{ ent.Schema }

func (Pic) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("pic")}
}

func (Pic) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").MaxLen(255).NotEmpty().Immutable(),
		field.String("user_id").Optional().MaxLen(255),
		field.String("pic_url").Optional().MaxLen(255).StorageKey("picUrl"),
		field.String("pid").Optional().MaxLen(255).
			Comment("父节点-如果设计编辑后，可以参考反馈查看"),
		field.String("remake").Optional().Comment("备注"),
		field.Bool("is_deleted").Optional().StorageKey("delete").Comment("软删除"),
	}
}

func (Pic) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("pics").
			Field("user_id").
			Unique(),
	}
}
