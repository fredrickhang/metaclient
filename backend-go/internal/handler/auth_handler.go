package handler

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/service"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles login / logout.
type AuthHandler struct {
	svc service.AuthService
}

func NewAuthHandler(svc service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}
	resp, err := h.svc.Login(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, dto.Fail(401, "用户名或密码错误"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(resp))
}

// Register handles POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}
	resp, err := h.svc.Register(req)
	if err != nil {
		if errors.Is(err, service.ErrUsernameTaken) {
			c.JSON(http.StatusConflict, dto.Fail(409, "用户名已被占用，请换一个"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusCreated, dto.OK(resp))
}

// Logout handles POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	token := tokenFromHeader(c)
	if token != "" {
		_ = h.svc.Logout(token)
	}
	c.JSON(http.StatusOK, dto.OK[any](nil))
}

// tokenFromHeader extracts the session token from X-User-Token header or Authorization: Bearer.
func tokenFromHeader(c *gin.Context) string {
	if t := c.GetHeader("X-User-Token"); t != "" {
		return t
	}
	h := c.GetHeader("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	return ""
}
