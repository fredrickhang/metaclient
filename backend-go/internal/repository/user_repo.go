package repository

import (
	"appmeta-backend/internal/model"

	"gorm.io/gorm"
)

type UserRepository interface {
	FindByUsername(username string) (*model.User, error)
	FindByID(id string) (*model.User, error)
	Create(u *model.User) error
	Update(u *model.User) error
}

type userRepositoryImpl struct{ db *gorm.DB }

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepositoryImpl{db: db}
}

func (r *userRepositoryImpl) FindByUsername(username string) (*model.User, error) {
	var u model.User
	if err := r.db.Where("username = ?", username).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepositoryImpl) FindByID(id string) (*model.User, error) {
	var u model.User
	if err := r.db.Where("id = ?", id).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepositoryImpl) Create(u *model.User) error {
	return r.db.Create(u).Error
}

func (r *userRepositoryImpl) Update(u *model.User) error {
	return r.db.Save(u).Error
}
