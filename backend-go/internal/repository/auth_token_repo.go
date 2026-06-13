package repository

import (
	"appmeta-backend/internal/model"
	"time"

	"gorm.io/gorm"
)

type AuthTokenRepository interface {
	Create(t *model.AuthToken) error
	FindByToken(token string) (*model.AuthToken, error)
	Delete(token string) error
	DeleteExpired() error
}

type authTokenRepositoryImpl struct{ db *gorm.DB }

func NewAuthTokenRepository(db *gorm.DB) AuthTokenRepository {
	return &authTokenRepositoryImpl{db: db}
}

func (r *authTokenRepositoryImpl) Create(t *model.AuthToken) error {
	return r.db.Create(t).Error
}

func (r *authTokenRepositoryImpl) FindByToken(token string) (*model.AuthToken, error) {
	var t model.AuthToken
	if err := r.db.Where("token = ?", token).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *authTokenRepositoryImpl) Delete(token string) error {
	return r.db.Where("token = ?", token).Delete(&model.AuthToken{}).Error
}

func (r *authTokenRepositoryImpl) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&model.AuthToken{}).Error
}
