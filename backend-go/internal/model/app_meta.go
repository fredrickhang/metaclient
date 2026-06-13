package model

import "time"

// AppMeta is the GORM model for the app_meta table.
type AppMeta struct {
	ID               string    `gorm:"column:id;primaryKey;type:varchar(64)"`
	Name             string    `gorm:"column:name;not null"`
	Description      string    `gorm:"column:description;type:text"`
	Category         string    `gorm:"column:category"`
	TagsJSON         string    `gorm:"column:tags;type:jsonb"`
	Author           string    `gorm:"column:author"`
	Status           string    `gorm:"column:status;type:text;check:status IN ('draft','published');default:'draft'"`
	ApiConfigJSON    string    `gorm:"column:api_config;type:jsonb"`
	InputsJSON       string    `gorm:"column:inputs;type:jsonb"`
	OutputsJSON      string    `gorm:"column:outputs;type:jsonb"`
	LayoutConfigJSON string    `gorm:"column:layout_config;type:jsonb"`
	EstimatedCredits int       `gorm:"column:estimated_credits;default:0"`
	RunCount         int       `gorm:"column:run_count;default:0"`
	LikeCount        int       `gorm:"column:like_count;default:0"`
	ViewCount        int       `gorm:"column:view_count;default:0"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (AppMeta) TableName() string { return "app_meta" }
