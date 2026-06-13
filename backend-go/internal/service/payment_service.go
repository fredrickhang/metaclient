package service

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/model"
	"appmeta-backend/internal/repository"
	"fmt"
	"time"
)

// PaymentService handles payment records and credit/membership top-ups.
type PaymentService interface {
	GetPayments(userID string) ([]dto.PaymentRecordResponse, error)
	CreatePayment(userID string, req dto.CreatePaymentRequest) (*dto.PaymentRecordResponse, error)
	GetSubscription(userID string) (*dto.UserMetaResponse, error)
}

type paymentServiceImpl struct {
	paymentRepo repository.PaymentRepository
	creditRepo  repository.UserCreditRepository
}

func NewPaymentService(
	paymentRepo repository.PaymentRepository,
	creditRepo repository.UserCreditRepository,
) PaymentService {
	return &paymentServiceImpl{paymentRepo: paymentRepo, creditRepo: creditRepo}
}

func (s *paymentServiceImpl) GetPayments(userID string) ([]dto.PaymentRecordResponse, error) {
	payments, err := s.paymentRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.PaymentRecordResponse, 0, len(payments))
	for _, p := range payments {
		result = append(result, toPaymentDTO(&p))
	}
	return result, nil
}

func (s *paymentServiceImpl) CreatePayment(userID string, req dto.CreatePaymentRequest) (*dto.PaymentRecordResponse, error) {
	orderID := fmt.Sprintf("ORD%d", time.Now().UnixMilli())
	p := &model.PaymentRecord{
		ID:           generateToken()[:20],
		UserID:       userID,
		OrderID:      orderID,
		Type:         req.Type,
		Description:  req.Description,
		Amount:       req.Amount,
		Status:       "paid",
		CreditsAdded: req.CreditsToAdd,
		TierID:       req.TierID,
	}
	if err := s.paymentRepo.Create(p); err != nil {
		return nil, err
	}

	// Update credits or membership
	switch req.Type {
	case "credits":
		if req.CreditsToAdd > 0 {
			_ = s.creditRepo.AddCredits(userID, req.CreditsToAdd)
		}
	case "membership":
		if req.TierID != "" {
			c, err := s.creditRepo.FindByUserID(userID)
			if err == nil {
				expiry := time.Now().Add(30 * 24 * time.Hour)
				c.MembershipTier = req.TierID
				c.MembershipExpiry = &expiry
				_ = s.creditRepo.Upsert(c)
			}
		}
	}

	resp := toPaymentDTO(p)
	return &resp, nil
}

func (s *paymentServiceImpl) GetSubscription(userID string) (*dto.UserMetaResponse, error) {
	c, err := s.creditRepo.FindByUserID(userID)
	if err != nil {
		return &dto.UserMetaResponse{}, nil
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

func toPaymentDTO(p *model.PaymentRecord) dto.PaymentRecordResponse {
	return dto.PaymentRecordResponse{
		ID:          p.ID,
		OrderID:     p.OrderID,
		Type:        p.Type,
		Description: p.Description,
		Amount:      p.Amount,
		Status:      p.Status,
		CreatedAt:   p.CreatedAt.Format(time.RFC3339),
	}
}
