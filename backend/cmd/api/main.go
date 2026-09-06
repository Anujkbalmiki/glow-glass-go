package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/anuj/glow-glass-go/backend/internal/config"
	"github.com/anuj/glow-glass-go/backend/internal/httpapi"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	server := httpapi.NewServer(cfg, logger)

	logger.Info("starting payroll api", "addr", cfg.HTTPAddr, "timezone", cfg.Timezone, "currency", cfg.Currency)
	httpServer := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           server.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	if err := httpServer.ListenAndServe(); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
