package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type User struct{ ent.Schema }

func (User) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("user")}
}

func (User) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").MaxLen(255).NotEmpty().Immutable(),
		field.String("wx_openid").Optional().MaxLen(255),
		field.String("phone").Optional().MaxLen(255),
		field.String("wx_name").Optional().MaxLen(255),
		field.Int("role_type").Optional(),
	}
}

func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("auth", Auth.Type).
			Ref("users").
			Field("role_type").
			Unique(),
		edge.To("messages", Message.Type),
		edge.To("pics", Pic.Type),
		edge.To("voices", Voice.Type),
	}
}
