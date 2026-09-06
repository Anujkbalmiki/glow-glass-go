package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/anuj/glow-glass-go/backend/internal/config"
)

type Server struct {
	config config.Config
	logger *slog.Logger
}

func NewServer(cfg config.Config, logger *slog.Logger) *Server {
	return &Server{config: cfg, logger: logger}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("GET /api/v1/config", s.configuration)
	return requestLogger(s.logger, mux)
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) configuration(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"currency":         s.config.Currency,
		"timezone":         s.config.Timezone,
		"salaryComponents": []string{"basic", "hra", "specialAllowance", "conveyance", "otherAllowance"},
		"statutoryRules":   s.config.StatutoryRules,
	})
}

func requestLogger(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		logger.Info("http request", "method", r.Method, "path", r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
