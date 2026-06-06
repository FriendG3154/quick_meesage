package repository

import (
	"context"
	"strconv"

	"quick_meesage/backend/ent"
	"quick_meesage/backend/ent/idea"
	"quick_meesage/backend/internal/domain"
)

type IdeaRepository struct {
	client *ent.Client
}

func NewIdeaRepository(client *ent.Client) *IdeaRepository {
	return &IdeaRepository{client: client}
}

func (r *IdeaRepository) Create(ctx context.Context, content, source string) (*domain.Idea, error) {
	row, err := r.client.Idea.Create().
		SetContent(content).
		SetSource(source).
		Save(ctx)
	if err != nil {
		return nil, err
	}
	return toDomainIdea(row), nil
}

func (r *IdeaRepository) List(ctx context.Context, cursor string, limit int) ([]*domain.Idea, string, bool, error) {
	query := r.client.Idea.Query().Order(ent.Desc(idea.FieldID)).Limit(limit + 1)
	if cursor != "" {
		id, err := strconv.Atoi(cursor)
		if err != nil {
			return nil, "", false, domain.ErrInvalidCursor
		}
		query = query.Where(idea.IDLT(id))
	}

	rows, err := query.All(ctx)
	if err != nil {
		return nil, "", false, err
	}

	hasMore := len(rows) > limit
	if hasMore {
		rows = rows[:limit]
	}

	items := make([]*domain.Idea, 0, len(rows))
	for _, row := range rows {
		items = append(items, toDomainIdea(row))
	}

	nextCursor := ""
	if hasMore && len(rows) > 0 {
		nextCursor = strconv.Itoa(rows[len(rows)-1].ID)
	}
	return items, nextCursor, hasMore, nil
}

func toDomainIdea(row *ent.Idea) *domain.Idea {
	return &domain.Idea{
		ID:        row.ID,
		Content:   row.Content,
		Source:    row.Source,
		CreatedAt: row.CreatedAt,
	}
}
