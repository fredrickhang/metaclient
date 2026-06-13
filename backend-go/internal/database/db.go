package database

import (
	"appmeta-backend/internal/model"
	"crypto/sha256"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// InitDB opens a GORM connection to PostgreSQL (Supabase), runs AutoMigrate for all models,
// and seeds default users if the users table is empty.
func InitDB(dsn string) (*gorm.DB, error) {
	if dsn == "" {
		return nil, fmt.Errorf("DB_DSN environment variable is not set")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// AutoMigrate creates or alters tables to match the model structs.
	if err := db.AutoMigrate(
		&model.User{},
		&model.AuthToken{},
		&model.UserCredit{},
		&model.AppMeta{},
		&model.RunRecord{},
		&model.PaymentRecord{},
	); err != nil {
		return nil, fmt.Errorf("auto-migrate failed: %w", err)
	}

	if err := seedDefaults(db); err != nil {
		return nil, fmt.Errorf("seed failed: %w", err)
	}

	return db, nil
}

// seedDefaults inserts the three demo accounts if the users table is empty.
func seedDefaults(db *gorm.DB) error {
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count > 0 {
		return nil
	}

	now := time.Now()
	in18Days := now.Add(18 * 24 * time.Hour)
	in30Days := now.Add(30 * 24 * time.Hour)
	in365Days := now.Add(365 * 24 * time.Hour)

	users := []model.User{
		{ID: "u-admin", Username: "admin", DisplayName: "管理员", PasswordHash: sha256Hex("admin123"), Email: "admin@appmeta.com", Role: "admin"},
		{ID: "u-user", Username: "user", DisplayName: "普通用户", PasswordHash: sha256Hex("user123"), Email: "user@appmeta.com", Role: "user"},
		{ID: "u-demo", Username: "demo", DisplayName: "Demo 用户", PasswordHash: sha256Hex("demo123"), Email: "demo@appmeta.com", Role: "user"},
	}
	if err := db.Create(&users).Error; err != nil {
		return err
	}

	credits := []model.UserCredit{
		{UserID: "u-admin", Credits: 9999, MembershipTier: "enterprise", MembershipExpiry: &in365Days},
		{UserID: "u-user", Credits: 348, MembershipTier: "pro", MembershipExpiry: &in18Days},
		{UserID: "u-demo", Credits: 100, MembershipTier: "basic", MembershipExpiry: &in30Days},
	}
	if err := db.Create(&credits).Error; err != nil {
		return err
	}

	sampleApps := buildSampleApps()
	if err := db.Create(&sampleApps).Error; err != nil {
		return err
	}

	return nil
}

func sha256Hex(s string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(s)))
}

func buildSampleApps() []model.AppMeta {
	now := time.Now()
	return []model.AppMeta{
		{
			ID: uuid.New().String(), Name: "AI 图片生成",
			Description: "输入文字描述，自动生成高质量 AI 图片。", Category: "图像生成",
			TagsJSON: `["图片","AI生成","文生图"]`, Author: "李四", Status: "published",
			EstimatedCredits: 12,
			ApiConfigJSON:    `{"endpoint":"https://api.example.com/image/generate","method":"POST","contentType":"json","timeoutMs":60000}`,
			InputsJSON:       `[{"name":"prompt","label":"描述词","type":"textarea","required":true,"width":"full","apiParamName":"prompt"}]`,
			OutputsJSON:      `[{"name":"images","label":"生成结果","type":"image","jsonPath":"data.images","width":"full"}]`,
			LayoutConfigJSON: `{"primaryColor":"#7c3aed","submitLabel":"立即生成","loadingLabel":"生成中…"}`,
			RunCount: 52841, LikeCount: 8932, ViewCount: 234891,
			CreatedAt: now, UpdatedAt: now,
		},
		{
			ID: uuid.New().String(), Name: "智能文章摘要",
			Description: "粘贴任意长文章，AI 自动提取核心要点，生成结构化摘要。", Category: "文本处理",
			TagsJSON: `["摘要","NLP","文本","效率"]`, Author: "王五", Status: "published",
			EstimatedCredits: 5,
			ApiConfigJSON:    `{"endpoint":"https://api.example.com/text/summarize","method":"POST","contentType":"json","timeoutMs":30000}`,
			InputsJSON:       `[{"name":"text","label":"文章内容","type":"textarea","required":true,"rows":8,"width":"full","apiParamName":"text"}]`,
			OutputsJSON:      `[{"name":"summary","label":"文章摘要","type":"markdown","jsonPath":"data.summary","width":"full"}]`,
			LayoutConfigJSON: `{"primaryColor":"#0ea5e9","submitLabel":"生成摘要","loadingLabel":"分析中…"}`,
			RunCount: 76432, LikeCount: 12480, ViewCount: 318000,
			CreatedAt: now, UpdatedAt: now,
		},
	}
}
