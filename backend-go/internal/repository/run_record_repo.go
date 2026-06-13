package repository

import (
	"appmeta-backend/internal/model"

	"gorm.io/gorm"
)

// RunRecordRepository defines the data-access contract for the run_record table.
type RunRecordRepository interface {
	Create(record *model.RunRecord) error
	Update(record *model.RunRecord) error
	FindByID(id string) (*model.RunRecord, error)
	FindByAppID(appID string) ([]model.RunRecord, error)
	FindByUserID(userID string) ([]model.RunRecord, error)
}

type runRecordRepositoryImpl struct {
	db *gorm.DB
}

// NewRunRecordRepository constructs a new RunRecordRepository backed by the given *gorm.DB.
func NewRunRecordRepository(db *gorm.DB) RunRecordRepository {
	return &runRecordRepositoryImpl{db: db}
}

func (r *runRecordRepositoryImpl) Create(record *model.RunRecord) error {
	return r.db.Create(record).Error
}

func (r *runRecordRepositoryImpl) Update(record *model.RunRecord) error {
	return r.db.Save(record).Error
}

func (r *runRecordRepositoryImpl) FindByID(id string) (*model.RunRecord, error) {
	var rec model.RunRecord
	if err := r.db.Where("id = ?", id).First(&rec).Error; err != nil {
		return nil, err
	}
	return &rec, nil
}

func (r *runRecordRepositoryImpl) FindByAppID(appID string) ([]model.RunRecord, error) {
	var records []model.RunRecord
	if err := r.db.Where("app_id = ?", appID).Order("started_at DESC").Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

func (r *runRecordRepositoryImpl) FindByUserID(userID string) ([]model.RunRecord, error) {
	var records []model.RunRecord
	if err := r.db.Where("user_id = ?", userID).Order("started_at DESC").Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}
