package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Pic struct{ ent.Schema }

func (Pic) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("pic")}
}

func (Pic) Mixin() []ent.Mixin {
	return []ent.Mixin{
		UUIDTimeMixin{},
		SoftDeleteMixin{},
	}
}

func (Pic) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("user_id", uuid.UUID{}).Optional(),
		field.String("pic_url").Optional().MaxLen(255).StorageKey("picUrl"),
		field.String("pid").Optional().MaxLen(255).
			Comment("父节点-如果设计编辑后，可以参考反馈查看"),
		field.String("remake").Optional().Comment("备注"),
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
