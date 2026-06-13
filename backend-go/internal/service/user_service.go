package service

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/model"
	"appmeta-backend/internal/repository"
	"errors"
	"time"

	"gorm.io/gorm"
)

// UserService handles account info, credits, and run-record operations.
type UserService interface {
	GetAccount(userID string) (*dto.UserInfoDTO, error)
	UpdateAccount(userID string, req dto.UpdateAccountRequest) (*dto.UserInfoDTO, error)
	ChangePassword(userID, currentPwd, newPwd string) error
	GetMeta(userID string) (*dto.UserMetaResponse, error)
	GetRecords(userID string) ([]dto.RunRecordResponse, error)
	CreateRecord(userID string, req dto.CreateRunRecordRequest) (*dto.RunRecordResponse, error)
	UpdateRecord(userID, recordID string, req dto.UpdateRunRecordRequest) (*dto.RunRecordResponse, error)
}

type userServiceImpl struct {
	userRepo   repository.UserRepository
	creditRepo repository.UserCreditRepository
	recordRepo repository.RunRecordRepository
}

func NewUserService(
	userRepo repository.UserRepository,
	creditRepo repository.UserCreditRepository,
	recordRepo repository.RunRecordRepository,
) UserService {
	return &userServiceImpl{userRepo: userRepo, creditRepo: creditRepo, recordRepo: recordRepo}
}

func (s *userServiceImpl) GetAccount(userID string) (*dto.UserInfoDTO, error) {
	u, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return toUserDTO(u), nil
}

func (s *userServiceImpl) UpdateAccount(userID string, req dto.UpdateAccountRequest) (*dto.UserInfoDTO, error) {
	u, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if req.DisplayName != "" {
		u.DisplayName = req.DisplayName
	}
	if req.Email != "" {
		u.Email = req.Email
	}
	u.Phone = req.Phone
	if err := s.userRepo.Update(u); err != nil {
		return nil, err
	}
	return toUserDTO(u), nil
}

func (s *userServiceImpl) ChangePassword(userID, currentPwd, newPwd string) error {
	u, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}
	if u.PasswordHash != hashPassword(currentPwd) {
		return ErrInvalidCredentials
	}
	u.PasswordHash = hashPassword(newPwd)
	return s.userRepo.Update(u)
}

func (s *userServiceImpl) GetMeta(userID string) (*dto.UserMetaResponse, error) {
	c, err := s.creditRepo.FindByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &dto.UserMetaResponse{Credits: 0, MembershipTier: ""}, nil
		}
		return nil, err
	}
	resp := &dto.UserMetaResponse{
		Credits:        c.Credits,
		MembershipTier: c.MembershipTier,
	}
	if c.MembershipExpiry != nil {
		s := c.MembershipExpiry.Format(time.RFC3339)
		resp.MembershipExpiry = &s
	}
	return resp, nil
}

func (s *userServiceImpl) GetRecords(userID string) ([]dto.RunRecordResponse, error) {
	recs, err := s.recordRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.RunRecordResponse, 0, len(recs))
	for _, r := range recs {
		result = append(result, toRunRecordDTO(&r))
	}
	return result, nil
}

func (s *userServiceImpl) CreateRecord(userID string, req dto.CreateRunRecordRequest) (*dto.RunRecordResponse, error) {
	rec := &model.RunRecord{
		ID:          generateToken()[:20],
		UserID:      userID,
		AppID:       req.AppID,
		AppName:     req.AppName,
		AppCategory: req.AppCategory,
		Status:      "running",
	}
	if err := s.recordRepo.Create(rec); err != nil {
		return nil, err
	}
	r := toRunRecordDTO(rec)
	return &r, nil
}

func (s *userServiceImpl) UpdateRecord(userID, recordID string, req dto.UpdateRunRecordRequest) (*dto.RunRecordResponse, error) {
	rec, err := s.recordRepo.FindByID(recordID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if rec.UserID != userID {
		return nil, ErrUnauthorized
	}
	if req.Status != "" {
		rec.Status = req.Status
	}
	if req.ResultText != "" {
		rec.ResultText = req.ResultText
	}
	if req.ErrorMsg != "" {
		rec.ErrorMsg = req.ErrorMsg
	}
	if req.CreditsUsed > 0 {
		rec.CreditsUsed = req.CreditsUsed
		_ = s.creditRepo.DeductCredits(userID, req.CreditsUsed)
	}
	if req.DurationMs > 0 {
		rec.DurationMs = req.DurationMs
		now := time.Now()
		rec.FinishedAt = &now
		exp := now.Add(24 * time.Hour)
		rec.ExpiresAt = &exp
	}
	if err := s.recordRepo.Update(rec); err != nil {
		return nil, err
	}
	r := toRunRecordDTO(rec)
	return &r, nil
}

// ── helpers ──────────────────────────────────────────────

func toUserDTO(u *model.User) *dto.UserInfoDTO {
	return &dto.UserInfoDTO{
		ID:          u.ID,
		Username:    u.Username,
		DisplayName: u.DisplayName,
		Email:       u.Email,
		Phone:       u.Phone,
		Role:        u.Role,
		Avatar:      u.Avatar,
		CreatedAt:   u.CreatedAt.Format(time.RFC3339),
	}
}

func toRunRecordDTO(r *model.RunRecord) dto.RunRecordResponse {
	resp := dto.RunRecordResponse{
		ID:          r.ID,
		AppID:       r.AppID,
		AppName:     r.AppName,
		AppCategory: r.AppCategory,
		Status:      r.Status,
		ResultText:  r.ResultText,
		ErrorMsg:    r.ErrorMsg,
		CreditsUsed: r.CreditsUsed,
		DurationMs:  r.DurationMs,
		CreatedAt:   r.StartedAt.Format(time.RFC3339),
	}
	if r.ExpiresAt != nil {
		s := r.ExpiresAt.Format(time.RFC3339)
		resp.ExpiresAt = &s
	}
	return resp
}
