package data

import (
	"fmt"

	"quick_message/backend/ent"
	"quick_message/backend/pkg/util"

	"entgo.io/ent/dialect/sql"
	"github.com/iancoleman/strcase"
)

type QueryHelper struct{}

func NewQueryHelper() *QueryHelper {
	return &QueryHelper{}
}

func (*QueryHelper) ApplyPagination(pageNum, pageSize int32) (int, int, bool) {
	return ApplyPagination(pageNum, pageSize)
}

func (*QueryHelper) BuildSortOptions(sorts []string, validColumn func(string) bool, defaultField string) ([]func(*sql.Selector), error) {
	return BuildSortOptions(sorts, validColumn, defaultField)
}

func (*QueryHelper) ParseFieldMask(paths []string, validColumn func(string) bool, allColumns []string) ([]string, error) {
	return ParseFieldMask(paths, validColumn, allColumns)
}

// ApplyPagination returns (offset, limit, true) if pagination is requested.
func ApplyPagination(pageNum, pageSize int32) (int, int, bool) {
	if pageNum > 0 && pageSize > 0 {
		return int((pageNum - 1) * pageSize), int(pageSize), true
	}
	return 0, 0, false
}

// BuildSortOptions parses sort strings, validates against validColumn, and returns order functions.
// If no sorts are provided, returns a single descending order on defaultField.
func BuildSortOptions(sorts []string, validColumn func(string) bool, defaultField string) ([]func(*sql.Selector), error) {
	fields, orders, ok := util.ParseAPISortsField(sorts)
	if !ok {
		return []func(*sql.Selector){ent.Desc(defaultField)}, nil
	}

	opts := make([]func(*sql.Selector), 0, len(fields))
	for idx, field := range fields {
		if !validColumn(field) {
			return nil, fmt.Errorf("无效的排序字段: %s", field)
		}
		if orders[idx] == "desc" {
			opts = append(opts, ent.Desc(field))
		} else {
			opts = append(opts, ent.Asc(field))
		}
	}
	return opts, nil
}

// ParseFieldMask converts FieldMask paths to snake_case column names and validates them.
// Returns the validated columns, or allColumns if no paths are specified.
func ParseFieldMask(paths []string, validColumn func(string) bool, allColumns []string) ([]string, error) {
	if len(paths) == 0 {
		return allColumns, nil
	}

	fields := make([]string, 0, len(paths))
	for _, path := range paths {
		field := strcase.ToSnake(path)
		if !validColumn(field) {
			return nil, fmt.Errorf("无效的字段: %s", field)
		}
		fields = append(fields, field)
	}
	return fields, nil
}
