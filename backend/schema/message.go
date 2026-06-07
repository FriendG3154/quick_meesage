package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Message struct{ ent.Schema }

func (Message) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("message")}
}

func (Message) Mixin() []ent.Mixin {
	return []ent.Mixin{
		UUIDTimeMixin{},
		SoftDeleteMixin{},
	}
}

func (Message) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("user_id", uuid.UUID{}).Optional(),
		field.String("content").Optional().Comment("表单内容"),
	}
}

func (Message) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("user", User.Type).
			Ref("messages").
			Field("user_id").
			Unique(),
	}
}
