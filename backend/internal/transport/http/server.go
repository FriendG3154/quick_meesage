package httpserver

import (
	"net/http"

	"quick_meesage/backend/internal/config"
)

func New(cfg config.Config) *http.Server {
	mux := http.NewServeMux()
	registerHealth(mux)

	return &http.Server{
		Addr:    cfg.HTTPAddr,
		Handler: mux,
	}
}

func registerHealth(mux *http.ServeMux) {
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
}
