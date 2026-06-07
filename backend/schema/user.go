package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type User struct{ ent.Schema }

func (User) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("user")}
}

func (User) Mixin() []ent.Mixin {
	return []ent.Mixin{
		UUIDTimeMixin{},
		SoftDeleteMixin{},
	}
}

func (User) Fields() []ent.Field {
	return []ent.Field{
		field.String("wx_openid").Optional().MaxLen(255),
		field.String("phone").Optional().MaxLen(255),
		field.String("wx_name").Optional().MaxLen(255),
		field.Int("role_type").Optional().Comment("角色类型:0-普通用户,1-会员"),
		field.UUID("auth_id", uuid.UUID{}).Optional().Comment("所属会员id"),
	}
}

func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("auth", Auth.Type).
			Ref("users").
			Field("auth_id").
			Unique(),
		edge.To("messages", Message.Type),
		edge.To("pics", Pic.Type),
		edge.To("voices", Voice.Type),
	}
}
