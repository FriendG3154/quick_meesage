package httpserver

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"quick_meesage/backend/internal/domain"
	"quick_meesage/backend/internal/service"
)

type ideaHandler struct {
	ideas *service.IdeaService
}

type createIdeaRequest struct {
	Content string `json:"content"`
	Source  string `json:"source"`
}

type createIdeaResponse struct {
	Idea ideaResponse `json:"idea"`
}

type listIdeasResponse struct {
	Ideas      []ideaResponse `json:"ideas"`
	NextCursor string         `json:"next_cursor"`
	HasMore    bool           `json:"has_more"`
}

type ideaResponse struct {
	ID        int    `json:"id"`
	Content   string `json:"content"`
	Source    string `json:"source"`
	CreatedAt string `json:"created_at"`
}

func registerIdeaRoutes(mux *http.ServeMux, ideas *service.IdeaService) {
	h := &ideaHandler{ideas: ideas}
	mux.HandleFunc("GET /api/v1/ideas", h.list)
	mux.HandleFunc("POST /api/v1/ideas", h.create)
}

func (h *ideaHandler) create(w http.ResponseWriter, r *http.Request) {
	var req createIdeaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeProblem(w, http.StatusBadRequest, "invalid-json", "请求体不是合法 JSON")
		return
	}

	idea, err := h.ideas.Create(r.Context(), req.Content, req.Source)
	if err != nil {
		if errors.Is(err, service.ErrInvalidIdeaContent) {
			writeProblem(w, http.StatusBadRequest, "invalid-content", "content 不能为空")
			return
		}
		writeProblem(w, http.StatusInternalServerError, "internal-error", "创建灵感失败")
		return
	}

	writeJSON(w, http.StatusCreated, createIdeaResponse{Idea: toIdeaResponse(idea)})
}

func (h *ideaHandler) list(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if raw := r.URL.Query().Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			writeProblem(w, http.StatusBadRequest, "invalid-limit", "limit 必须是数字")
			return
		}
		limit = parsed
	}

	ideas, nextCursor, hasMore, err := h.ideas.List(r.Context(), r.URL.Query().Get("cursor"), limit)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCursor) {
			writeProblem(w, http.StatusBadRequest, "invalid-cursor", "cursor 不合法")
			return
		}
		writeProblem(w, http.StatusInternalServerError, "internal-error", "获取灵感列表失败")
		return
	}

	items := make([]ideaResponse, 0, len(ideas))
	for _, idea := range ideas {
		items = append(items, toIdeaResponse(idea))
	}
	writeJSON(w, http.StatusOK, listIdeasResponse{
		Ideas:      items,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	})
}

func toIdeaResponse(idea *domain.Idea) ideaResponse {
	return ideaResponse{
		ID:        idea.ID,
		Content:   idea.Content,
		Source:    idea.Source,
		CreatedAt: idea.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
