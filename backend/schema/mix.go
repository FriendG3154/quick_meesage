package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/mixin"
	"github.com/google/uuid"
)

type UUIDTimeMixin struct {
	mixin.Schema
}

func (UUIDTimeMixin) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Immutable().
			Unique().
			Default(uuid.New).
			Comment("主键id"),

		field.Time("created_at").
			Immutable().
			Default(time.Now).
			Annotations(
				entsql.Default("CURRENT_TIMESTAMP"),
			).
			Comment("创建时间"),

		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now).
			Annotations(
				entsql.Default("CURRENT_TIMESTAMP"),
			).
			Comment("更新时间"),
	}
}

type UUIDCreatedAtMixin struct {
	mixin.Schema
}

func (UUIDCreatedAtMixin) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Immutable().
			Unique().
			Default(uuid.New).
			Comment("主键id"),

		field.Time("created_at").
			Immutable().
			Default(time.Now).
			Annotations(
				entsql.Default("CURRENT_TIMESTAMP"),
			).
			Comment("创建时间"),
	}
}

type SoftDeleteMixin struct {
	mixin.Schema
}

func (SoftDeleteMixin) Fields() []ent.Field {
	return []ent.Field{
		field.Bool("is_deleted").
			Default(false).
			Comment("软删除标记"),
	}
}
