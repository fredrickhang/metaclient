package model

import "time"

// UserCredit is the GORM model for the user_credits table.
type UserCredit struct {
	UserID           string     `gorm:"column:user_id;primaryKey;type:varchar(64)"`
	Credits          int        `gorm:"column:credits;not null;default:0"`
	MembershipTier   string     `gorm:"column:membership_tier;type:varchar(32);not null;default:''"`
	MembershipExpiry *time.Time `gorm:"column:membership_expiry"`
	UpdatedAt        time.Time  `gorm:"column:updated_at;autoUpdateTime"`
}

func (UserCredit) TableName() string { return "user_credits" }
