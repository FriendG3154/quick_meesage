package grpcserver

import (
	"context"
	"errors"

	inspirationv1 "quick_meesage/backend/api/gen/inspiration/v1"
	"quick_meesage/backend/internal/domain"
	"quick_meesage/backend/internal/service"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type InspirationService struct {
	inspirationv1.UnimplementedInspirationServiceServer
	ideas *service.IdeaService
}

func NewInspirationService(ideas *service.IdeaService) *InspirationService {
	return &InspirationService{ideas: ideas}
}

func (s *InspirationService) CreateIdea(ctx context.Context, req *inspirationv1.CreateIdeaRequest) (*inspirationv1.CreateIdeaResponse, error) {
	idea, err := s.ideas.Create(ctx, req.GetContent(), req.GetSource())
	if err != nil {
		if errors.Is(err, service.ErrInvalidIdeaContent) {
			return nil, status.Error(codes.InvalidArgument, "content is required")
		}
		return nil, status.Error(codes.Internal, "create idea failed")
	}
	return &inspirationv1.CreateIdeaResponse{Idea: toProtoIdea(idea)}, nil
}

func (s *InspirationService) ListIdeas(ctx context.Context, req *inspirationv1.ListIdeasRequest) (*inspirationv1.ListIdeasResponse, error) {
	ideas, nextCursor, hasMore, err := s.ideas.List(ctx, req.GetCursor(), int(req.GetLimit()))
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCursor) {
			return nil, status.Error(codes.InvalidArgument, "cursor is invalid")
		}
		return nil, status.Error(codes.Internal, "list ideas failed")
	}

	items := make([]*inspirationv1.Idea, 0, len(ideas))
	for _, idea := range ideas {
		items = append(items, toProtoIdea(idea))
	}
	return &inspirationv1.ListIdeasResponse{
		Ideas:      items,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}, nil
}

func toProtoIdea(idea *domain.Idea) *inspirationv1.Idea {
	return &inspirationv1.Idea{
		Id:        int64(idea.ID),
		Content:   idea.Content,
		Source:    idea.Source,
		CreatedAt: idea.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
