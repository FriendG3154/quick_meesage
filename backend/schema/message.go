package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Message struct{ ent.Schema }

func (Message) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("message")}
}

func (Message) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").MaxLen(255).NotEmpty().Unique().Immutable(),
		field.String("user_id").Optional().MaxLen(255),
		field.String("content").Optional().Comment("表单内容"),
		field.Bool("is_deleted").Optional().StorageKey("delete"),
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
