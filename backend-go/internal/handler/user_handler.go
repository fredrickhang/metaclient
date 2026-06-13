package handler

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// UserHandler handles account info, credits, and run-record endpoints.
type UserHandler struct {
	svc     service.UserService
	authSvc service.AuthService
}

func NewUserHandler(svc service.UserService, authSvc service.AuthService) *UserHandler {
	return &UserHandler{svc: svc, authSvc: authSvc}
}

// GetAccount handles GET /api/user/account
func (h *UserHandler) GetAccount(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	acc, err := h.svc.GetAccount(userID)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.OK(acc))
}

// UpdateAccount handles PUT /api/user/account
func (h *UserHandler) UpdateAccount(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	var req dto.UpdateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}
	acc, err := h.svc.UpdateAccount(userID, req)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.OK(acc))
}

// ChangePassword handles PUT /api/user/password
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}
	if err := h.svc.ChangePassword(userID, req.CurrentPassword, req.NewPassword); err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			c.JSON(http.StatusBadRequest, dto.Fail(400, "当前密码错误"))
			return
		}
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.OK[any](nil))
}

// GetMeta handles GET /api/user/meta
func (h *UserHandler) GetMeta(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	meta, err := h.svc.GetMeta(userID)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.OK(meta))
}

// GetRecords handles GET /api/records
func (h *UserHandler) GetRecords(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	records, err := h.svc.GetRecords(userID)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.OK(records))
}

// CreateRecord handles POST /api/records
func (h *UserHandler) CreateRecord(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	var req dto.CreateRunRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}
	rec, err := h.svc.CreateRecord(userID, req)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.OK(rec))
}

// UpdateRecord handles PUT /api/records/:id
func (h *UserHandler) UpdateRecord(c *gin.Context) {
	userID := h.mustUserID(c)
	if userID == "" {
		return
	}
	id := c.Param("id")
	var req dto.UpdateRunRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}
	rec, err := h.svc.UpdateRecord(userID, id, req)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.OK(rec))
}

// ── helpers ──────────────────────────────────────────────

func (h *UserHandler) mustUserID(c *gin.Context) string {
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

func (h *UserHandler) handleErr(c *gin.Context, err error) {
	if errors.Is(err, service.ErrNotFound) {
		c.JSON(http.StatusNotFound, dto.Fail(404, "资源不存在"))
		return
	}
	if errors.Is(err, service.ErrUnauthorized) {
		c.JSON(http.StatusForbidden, dto.Fail(403, "无权限"))
		return
	}
	c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
}
