package model

import "time"

// User is the GORM model for the users table.
type User struct {
	ID           string    `gorm:"column:id;primaryKey;type:varchar(64)"`
	Username     string    `gorm:"column:username;uniqueIndex;type:varchar(64);not null"`
	DisplayName  string    `gorm:"column:display_name;type:varchar(128);not null"`
	PasswordHash string    `gorm:"column:password_hash;type:varchar(128);not null"`
	Email        string    `gorm:"column:email;type:varchar(255);not null;default:''"`
	Phone        string    `gorm:"column:phone;type:varchar(20);not null;default:''"`
	Role         string    `gorm:"column:role;type:enum('user','admin');not null;default:'user'"`
	Avatar       string    `gorm:"column:avatar;type:varchar(512);not null;default:''"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (User) TableName() string { return "users" }
