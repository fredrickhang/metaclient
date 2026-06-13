package service

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/model"
	"appmeta-backend/internal/repository"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppMetaService defines the business-logic contract for application metadata.
type AppMetaService interface {
	ListApps(status, category, keyword string) ([]dto.AppMetaResponse, error)
	GetApp(id string) (*dto.AppMetaResponse, error)
	CreateApp(req dto.CreateAppRequest) (*dto.AppMetaResponse, error)
	UpdateApp(id string, req dto.UpdateAppRequest) (*dto.AppMetaResponse, error)
	PublishApp(id string) (*dto.AppMetaResponse, error)
	UnpublishApp(id string) (*dto.AppMetaResponse, error)
	DeleteApp(id string) error
	IncrementViews(id string)
}

type appMetaServiceImpl struct {
	repo repository.AppMetaRepository
}

// NewAppMetaService constructs a new AppMetaService.
func NewAppMetaService(repo repository.AppMetaRepository) AppMetaService {
	return &appMetaServiceImpl{repo: repo}
}

// ---------- public methods ----------

func (s *appMetaServiceImpl) ListApps(status, category, keyword string) ([]dto.AppMetaResponse, error) {
	apps, err := s.repo.FindAll(status, category, keyword)
	if err != nil {
		return nil, err
	}
	result := make([]dto.AppMetaResponse, 0, len(apps))
	for _, a := range apps {
		r, err := toResponse(&a)
		if err != nil {
			return nil, err
		}
		result = append(result, *r)
	}
	return result, nil
}

func (s *appMetaServiceImpl) GetApp(id string) (*dto.AppMetaResponse, error) {
	app, err := s.repo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return toResponse(app)
}

func (s *appMetaServiceImpl) CreateApp(req dto.CreateAppRequest) (*dto.AppMetaResponse, error) {
	app := &model.AppMeta{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Author:      req.Author,
		Status:      "draft",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if err := marshalJSONField(req.Tags, &app.TagsJSON); err != nil {
		return nil, err
	}
	if err := marshalJSONField(req.ApiConfig, &app.ApiConfigJSON); err != nil {
		return nil, err
	}
	if err := marshalJSONField(req.Inputs, &app.InputsJSON); err != nil {
		return nil, err
	}
	if err := marshalJSONField(req.Outputs, &app.OutputsJSON); err != nil {
		return nil, err
	}
	if err := marshalJSONField(req.LayoutConfig, &app.LayoutConfigJSON); err != nil {
		return nil, err
	}
	if err := s.repo.Create(app); err != nil {
		return nil, err
	}
	return toResponse(app)
}

func (s *appMetaServiceImpl) UpdateApp(id string, req dto.UpdateAppRequest) (*dto.AppMetaResponse, error) {
	app, err := s.repo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if req.Name != "" {
		app.Name = req.Name
	}
	if req.Description != "" {
		app.Description = req.Description
	}
	if req.Category != "" {
		app.Category = req.Category
	}
	if req.Author != "" {
		app.Author = req.Author
	}
	if req.Tags != nil {
		if err := marshalJSONField(req.Tags, &app.TagsJSON); err != nil {
			return nil, err
		}
	}
	if req.ApiConfig != nil {
		if err := marshalJSONField(req.ApiConfig, &app.ApiConfigJSON); err != nil {
			return nil, err
		}
	}
	if req.Inputs != nil {
		if err := marshalJSONField(req.Inputs, &app.InputsJSON); err != nil {
			return nil, err
		}
	}
	if req.Outputs != nil {
		if err := marshalJSONField(req.Outputs, &app.OutputsJSON); err != nil {
			return nil, err
		}
	}
	if req.LayoutConfig != nil {
		if err := marshalJSONField(req.LayoutConfig, &app.LayoutConfigJSON); err != nil {
			return nil, err
		}
	}
	app.UpdatedAt = time.Now()
	if err := s.repo.Update(app); err != nil {
		return nil, err
	}
	return toResponse(app)
}

func (s *appMetaServiceImpl) PublishApp(id string) (*dto.AppMetaResponse, error) {
	app, err := s.repo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	app.Status = "published"
	app.UpdatedAt = time.Now()
	if err := s.repo.Update(app); err != nil {
		return nil, err
	}
	return toResponse(app)
}

func (s *appMetaServiceImpl) UnpublishApp(id string) (*dto.AppMetaResponse, error) {
	app, err := s.repo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	app.Status = "draft"
	app.UpdatedAt = time.Now()
	if err := s.repo.Update(app); err != nil {
		return nil, err
	}
	return toResponse(app)
}

func (s *appMetaServiceImpl) DeleteApp(id string) error {
	_, err := s.repo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	return s.repo.Delete(id)
}

func (s *appMetaServiceImpl) IncrementViews(id string) {
	// Best-effort; ignore errors so the main response is not blocked.
	_ = s.repo.IncrementViewCount(id)
}

// ---------- helpers ----------

// ErrNotFound is returned when a requested resource does not exist.
var ErrNotFound = errors.New("not found")

// marshalJSONField serialises v to JSON and writes the result into dest.
// If v is nil the dest string is set to "null".
func marshalJSONField(v any, dest *string) error {
	if v == nil {
		*dest = "null"
		return nil
	}
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	*dest = string(b)
	return nil
}

// toResponse converts a model.AppMeta to a dto.AppMetaResponse, deserialising JSON columns.
func toResponse(m *model.AppMeta) (*dto.AppMetaResponse, error) {
	r := &dto.AppMetaResponse{
		ID:          m.ID,
		Name:        m.Name,
		Description: m.Description,
		Category:    m.Category,
		Author:      m.Author,
		Status:      m.Status,
		RunCount:    m.RunCount,
		LikeCount:   m.LikeCount,
		ViewCount:   m.ViewCount,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}

	if m.TagsJSON != "" && m.TagsJSON != "null" {
		if err := json.Unmarshal([]byte(m.TagsJSON), &r.Tags); err != nil {
			return nil, err
		}
	}
	if r.Tags == nil {
		r.Tags = []string{}
	}

	if m.ApiConfigJSON != "" && m.ApiConfigJSON != "null" {
		r.ApiConfig = &dto.ApiConfigDTO{}
		if err := json.Unmarshal([]byte(m.ApiConfigJSON), r.ApiConfig); err != nil {
			return nil, err
		}
	}

	if m.InputsJSON != "" && m.InputsJSON != "null" {
		if err := json.Unmarshal([]byte(m.InputsJSON), &r.Inputs); err != nil {
			return nil, err
		}
	}
	if r.Inputs == nil {
		r.Inputs = []dto.InputFieldDTO{}
	}

	if m.OutputsJSON != "" && m.OutputsJSON != "null" {
		if err := json.Unmarshal([]byte(m.OutputsJSON), &r.Outputs); err != nil {
			return nil, err
		}
	}
	if r.Outputs == nil {
		r.Outputs = []dto.OutputFieldDTO{}
	}

	if m.LayoutConfigJSON != "" && m.LayoutConfigJSON != "null" {
		r.LayoutConfig = &dto.PageLayoutDTO{}
		if err := json.Unmarshal([]byte(m.LayoutConfigJSON), r.LayoutConfig); err != nil {
			return nil, err
		}
	}

	return r, nil
}
