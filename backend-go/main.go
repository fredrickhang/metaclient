package main

import (
	"appmeta-backend/internal/config"
	"appmeta-backend/internal/database"
	"appmeta-backend/internal/mockdb"
	"appmeta-backend/internal/repository"
	"appmeta-backend/internal/router"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found, reading from environment")
	}

	cfg := config.Load()

	var logger *zap.Logger
	var err error
	if cfg.GinMode == "release" {
		logger, err = zap.NewProduction()
	} else {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to initialise logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync() //nolint:errcheck

	gin.SetMode(cfg.GinMode)

	var repos router.Repos

	if cfg.DBDSN == "" {
		// ── Mock 模式：无需数据库，内存数据 ──────────────────
		logger.Info("DB_DSN not set — starting in MOCK mode (in-memory data)")
		repos = router.Repos{
			AppMeta:   mockdb.NewMockAppMetaRepository(),
			RunRecord: mockdb.NewMockRunRecordRepository(),
			User:      mockdb.NewMockUserRepository(),
			Token:     mockdb.NewMockAuthTokenRepository(),
			Credit:    mockdb.NewMockUserCreditRepository(),
			Payment:   mockdb.NewMockPaymentRepository(),
		}
	} else {
		// ── 真实数据库模式 ────────────────────────────────────
		db, dbErr := database.InitDB(cfg.DBDSN)
		if dbErr != nil {
			logger.Fatal("failed to initialise database", zap.Error(dbErr))
		}
		logger.Info("database connected and migrated")
		repos = router.Repos{
			AppMeta:   repository.NewAppMetaRepository(db),
			RunRecord: repository.NewRunRecordRepository(db),
			User:      repository.NewUserRepository(db),
			Token:     repository.NewAuthTokenRepository(db),
			Credit:    repository.NewUserCreditRepository(db),
			Payment:   repository.NewPaymentRepository(db),
		}
	}

	r := router.SetupRouter(repos, logger)

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	logger.Info("starting server", zap.String("addr", addr))
	if err := r.Run(addr); err != nil {
		logger.Fatal("server exited with error", zap.Error(err))
	}
}
