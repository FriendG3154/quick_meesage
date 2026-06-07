package util

import (
	"strings"

	"github.com/iancoleman/strcase"
)

func TrimInt64Array(inputs []int64) ([]int64, bool) {
	result := make([]int64, 0)

	for _, v := range inputs {
		if v != 0 {
			result = append(result, v)
		}
	}

	return result, len(result) > 0
}

func TrimStringArray(inputs []string) ([]string, bool) {
	result := make([]string, 0)

	for _, v := range inputs {
		v = strings.TrimSpace(v)
		if v != "" {
			result = append(result, v)
		}
	}

	return result, len(result) > 0
}

func ParseAPISortsField(input []string) ([]string, []string, bool) {
	fields := make([]string, 0)
	orders := make([]string, 0)
	count := int32(0)

	for _, sort := range input {
		if strings.TrimSpace(sort) == "" {
			continue
		}
		// 先用冒号:分割字段和排序方式
		parts := strings.SplitN(sort, ":", 2)
		if len(parts) != 2 {
			continue
		}
		field := strcase.ToSnake(parts[0])
		order := strings.ToLower(parts[1])
		if order != "asc" && order != "desc" {
			continue
		}
		fields = append(fields, field)
		orders = append(orders, order)
		count++
	}
	return fields, orders, count > 0
}
