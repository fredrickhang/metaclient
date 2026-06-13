package model

import "time"

// AuthToken is the GORM model for the auth_tokens table.
type AuthToken struct {
	Token     string    `gorm:"column:token;primaryKey;type:varchar(128)"`
	UserID    string    `gorm:"column:user_id;type:varchar(64);not null;index"`
	Role      string    `gorm:"column:role;type:varchar(20);not null"`
	ExpiresAt time.Time `gorm:"column:expires_at;not null;index"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (AuthToken) TableName() string { return "auth_tokens" }
