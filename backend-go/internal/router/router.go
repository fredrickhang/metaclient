package router

import (
	"appmeta-backend/internal/handler"
	"appmeta-backend/internal/repository"
	"appmeta-backend/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Repos bundles all repository interfaces so SetupRouter doesn't depend on *gorm.DB.
type Repos struct {
	AppMeta   repository.AppMetaRepository
	RunRecord repository.RunRecordRepository
	User      repository.UserRepository
	Token     repository.AuthTokenRepository
	Credit    repository.UserCreditRepository
	Payment   repository.PaymentRepository
}

// SetupRouter wires all dependencies and returns a configured *gin.Engine.
func SetupRouter(repos Repos, logger *zap.Logger) *gin.Engine {
	// ── Services ──────────────────────────────────────────
	appMetaSvc   := service.NewAppMetaService(repos.AppMeta)
	appRunnerSvc := service.NewAppRunnerService(repos.AppMeta, repos.RunRecord)
	authSvc      := service.NewAuthService(repos.User, repos.Token)
	userSvc      := service.NewUserService(repos.User, repos.Credit, repos.RunRecord)
	paymentSvc   := service.NewPaymentService(repos.Payment, repos.Credit)

	// ── Handlers ──────────────────────────────────────────
	appMetaHandler   := handler.NewAppMetaHandler(appMetaSvc)
	appRunnerHandler := handler.NewAppRunnerHandler(appRunnerSvc)
	authHandler      := handler.NewAuthHandler(authSvc)
	userHandler      := handler.NewUserHandler(userSvc, authSvc)
	paymentHandler   := handler.NewPaymentHandler(paymentSvc, authSvc)

	// ── Engine ────────────────────────────────────────────
	r := gin.New()
	r.Use(handler.CORSMiddleware())
	r.Use(handler.LoggerMiddleware(logger))
	r.Use(gin.Recovery())

	// 健康检查 — 用浏览器访问 http://localhost:8080/health 确认服务在跑
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "mode": "mock"})
	})

	api := r.Group("/api")
	{
		// Auth
		auth := api.Group("/auth")
		{
			auth.POST("/login",    authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/logout",   authHandler.Logout)
		}

		// Application metadata
		apps := api.Group("/apps")
		{
			apps.GET("",              appMetaHandler.ListApps)
			apps.GET("/:id",          appMetaHandler.GetApp)
			apps.POST("",             appMetaHandler.CreateApp)
			apps.PUT("/:id",          appMetaHandler.UpdateApp)
			apps.DELETE("/:id",       appMetaHandler.DeleteApp)
			apps.POST("/:id/publish",   appMetaHandler.PublishApp)
			apps.POST("/:id/unpublish", appMetaHandler.UnpublishApp)
		}

		// Runner
		runner := api.Group("/runner")
		{
			runner.POST("/run",             appRunnerHandler.RunApp)
			runner.GET("/runs/:runId",      appRunnerHandler.GetRunRecord)
			runner.GET("/apps/:appId/runs", appRunnerHandler.ListRunRecords)
		}

		// User account + meta
		user := api.Group("/user")
		{
			user.GET("/account",  userHandler.GetAccount)
			user.PUT("/account",  userHandler.UpdateAccount)
			user.PUT("/password", userHandler.ChangePassword)
			user.GET("/meta",     userHandler.GetMeta)
		}

		// Run records
		records := api.Group("/records")
		{
			records.GET("",     userHandler.GetRecords)
			records.POST("",    userHandler.CreateRecord)
			records.PUT("/:id", userHandler.UpdateRecord)
		}

		// Payments & subscription
		payments := api.Group("/payments")
		{
			payments.GET("",  paymentHandler.GetPayments)
			payments.POST("", paymentHandler.CreatePayment)
		}
		api.GET("/subscription", paymentHandler.GetSubscription)
	}

	return r
}
