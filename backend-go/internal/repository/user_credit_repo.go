package repository

import (
	"appmeta-backend/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserCreditRepository interface {
	FindByUserID(userID string) (*model.UserCredit, error)
	Upsert(c *model.UserCredit) error
	AddCredits(userID string, delta int) error
	DeductCredits(userID string, amount int) error
}

type userCreditRepositoryImpl struct{ db *gorm.DB }

func NewUserCreditRepository(db *gorm.DB) UserCreditRepository {
	return &userCreditRepositoryImpl{db: db}
}

func (r *userCreditRepositoryImpl) FindByUserID(userID string) (*model.UserCredit, error) {
	var c model.UserCredit
	if err := r.db.Where("user_id = ?", userID).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *userCreditRepositoryImpl) Upsert(c *model.UserCredit) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"credits", "membership_tier", "membership_expiry", "updated_at"}),
	}).Create(c).Error
}

func (r *userCreditRepositoryImpl) AddCredits(userID string, delta int) error {
	return r.db.Model(&model.UserCredit{}).
		Where("user_id = ?", userID).
		UpdateColumn("credits", gorm.Expr("credits + ?", delta)).Error
}

func (r *userCreditRepositoryImpl) DeductCredits(userID string, amount int) error {
	return r.db.Model(&model.UserCredit{}).
		Where("user_id = ? AND credits >= ?", userID, amount).
		UpdateColumn("credits", gorm.Expr("credits - ?", amount)).Error
}
