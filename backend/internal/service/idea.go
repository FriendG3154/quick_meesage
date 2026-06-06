package service

import (
	"context"
	"errors"
	"strings"

	"quick_meesage/backend/internal/domain"
)

var ErrInvalidIdeaContent = errors.New("idea content is required")

type IdeaRepository interface {
	Create(ctx context.Context, content, source string) (*domain.Idea, error)
	List(ctx context.Context, cursor string, limit int) ([]*domain.Idea, string, bool, error)
}

type IdeaService struct {
	repo IdeaRepository
}

func NewIdeaService(repo IdeaRepository) *IdeaService {
	return &IdeaService{repo: repo}
}

func (s *IdeaService) Create(ctx context.Context, content, source string) (*domain.Idea, error) {
	content = strings.TrimSpace(content)
	source = strings.TrimSpace(source)
	if content == "" {
		return nil, ErrInvalidIdeaContent
	}
	if source == "" {
		source = "text"
	}
	return s.repo.Create(ctx, content, source)
}

func (s *IdeaService) List(ctx context.Context, cursor string, limit int) ([]*domain.Idea, string, bool, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	return s.repo.List(ctx, cursor, limit)
}
