package model

import "time"

// PaymentRecord is the GORM model for the payment_records table.
type PaymentRecord struct {
	ID           string    `gorm:"column:id;primaryKey;type:varchar(64)"`
	UserID       string    `gorm:"column:user_id;type:varchar(64);not null;index"`
	OrderID      string    `gorm:"column:order_id;type:varchar(64);not null;uniqueIndex"`
	Type         string    `gorm:"column:type;type:text;check:type IN ('membership','credits');not null"`
	Description  string    `gorm:"column:description;type:varchar(255);not null;default:''"`
	Amount       float64   `gorm:"column:amount;type:numeric(10,2);not null;default:0"`
	Status       string    `gorm:"column:status;type:text;check:status IN ('paid','pending','refunded');not null;default:'paid'"`
	CreditsAdded int       `gorm:"column:credits_added;not null;default:0"`
	TierID       string    `gorm:"column:tier_id;type:varchar(32);not null;default:''"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (PaymentRecord) TableName() string { return "payment_records" }
