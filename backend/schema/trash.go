package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/field"
)

type Trash struct{ ent.Schema }

func (Trash) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Table("trash")}
}

func (Trash) Mixin() []ent.Mixin {
	return []ent.Mixin{
		UUIDTimeMixin{},
		SoftDeleteMixin{},
	}
}

func (Trash) Fields() []ent.Field {
	return []ent.Field{
		field.String("source_id").Optional().MaxLen(255).Comment("源id"),
		field.Int("type").Optional().Comment("垃圾源类型"),
	}
}
