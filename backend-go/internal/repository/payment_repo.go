package repository

import (
	"appmeta-backend/internal/model"

	"gorm.io/gorm"
)

type PaymentRepository interface {
	FindByUserID(userID string) ([]model.PaymentRecord, error)
	Create(p *model.PaymentRecord) error
}

type paymentRepositoryImpl struct{ db *gorm.DB }

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepositoryImpl{db: db}
}

func (r *paymentRepositoryImpl) FindByUserID(userID string) ([]model.PaymentRecord, error) {
	var payments []model.PaymentRecord
	if err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

func (r *paymentRepositoryImpl) Create(p *model.PaymentRecord) error {
	return r.db.Create(p).Error
}
