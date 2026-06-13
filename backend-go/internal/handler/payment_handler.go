package handler

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

// PaymentHandler handles payment and subscription endpoints.
type PaymentHandler struct {
	svc     service.PaymentService
	authSvc service.AuthService
}

func NewPaymentHandler(svc service.PaymentService, authSvc service.AuthService) *PaymentHandler {
	return &PaymentHandler{svc: svc, authSvc: authSvc}
}

// GetPayments handles GET /api/payments
func (h *PaymentHandler) GetPayments(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	payments, err := h.svc.GetPayments(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(payments))
}

// CreatePayment handles POST /api/payments
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	var req dto.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}
	p, err := h.svc.CreatePayment(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusCreated, dto.OK(p))
}

// GetSubscription handles GET /api/subscription
func (h *PaymentHandler) GetSubscription(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	sub, err := h.svc.GetSubscription(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(sub))
}

func (h *PaymentHandler) mustUserID(c *gin.Context) string {
	token := tokenFromHeader(c)
	if token == "" {
		c.JSON(http.StatusUnauthorized, dto.Fail(401, "未登录"))
		return ""
	}
	t, err := h.authSvc.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.Fail(401, "token 无效或已过期"))
		return ""
	}
	return t.UserID
}
