package repository

import (
	"appmeta-backend/internal/model"
	"fmt"

	"gorm.io/gorm"
)

// AppMetaRepository defines the data-access contract for the app_meta table.
type AppMetaRepository interface {
	FindAll(status, category, keyword string) ([]model.AppMeta, error)
	FindByID(id string) (*model.AppMeta, error)
	Create(app *model.AppMeta) error
	Update(app *model.AppMeta) error
	Delete(id string) error
	IncrementRunCount(id string) error
	IncrementViewCount(id string) error
}

type appMetaRepositoryImpl struct {
	db *gorm.DB
}

// NewAppMetaRepository constructs a new AppMetaRepository backed by the given *gorm.DB.
func NewAppMetaRepository(db *gorm.DB) AppMetaRepository {
	return &appMetaRepositoryImpl{db: db}
}

func (r *appMetaRepositoryImpl) FindAll(status, category, keyword string) ([]model.AppMeta, error) {
	tx := r.db.Model(&model.AppMeta{})
	if status != "" {
		tx = tx.Where("status = ?", status)
	}
	if category != "" {
		tx = tx.Where("category = ?", category)
	}
	if keyword != "" {
		like := fmt.Sprintf("%%%s%%", keyword)
		tx = tx.Where("name LIKE ? OR description LIKE ?", like, like)
	}
	var apps []model.AppMeta
	if err := tx.Order("created_at DESC").Find(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *appMetaRepositoryImpl) FindByID(id string) (*model.AppMeta, error) {
	var app model.AppMeta
	if err := r.db.Where("id = ?", id).First(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

func (r *appMetaRepositoryImpl) Create(app *model.AppMeta) error {
	return r.db.Create(app).Error
}

func (r *appMetaRepositoryImpl) Update(app *model.AppMeta) error {
	return r.db.Save(app).Error
}

func (r *appMetaRepositoryImpl) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.AppMeta{}).Error
}

func (r *appMetaRepositoryImpl) IncrementRunCount(id string) error {
	return r.db.Model(&model.AppMeta{}).Where("id = ?", id).
		UpdateColumn("run_count", gorm.Expr("run_count + ?", 1)).Error
}

func (r *appMetaRepositoryImpl) IncrementViewCount(id string) error {
	return r.db.Model(&model.AppMeta{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error
}
