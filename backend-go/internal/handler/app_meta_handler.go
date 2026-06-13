package handler

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AppMetaHandler handles HTTP requests for application metadata.
type AppMetaHandler struct {
	svc service.AppMetaService
}

// NewAppMetaHandler constructs a new AppMetaHandler.
func NewAppMetaHandler(svc service.AppMetaService) *AppMetaHandler {
	return &AppMetaHandler{svc: svc}
}

// ListApps handles GET /api/apps
func (h *AppMetaHandler) ListApps(c *gin.Context) {
	status := c.Query("status")
	category := c.Query("category")
	keyword := c.Query("keyword")

	apps, err := h.svc.ListApps(status, category, keyword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(apps))
}

// GetApp handles GET /api/apps/:id
func (h *AppMetaHandler) GetApp(c *gin.Context) {
	id := c.Param("id")

	// Increment view count asynchronously.
	go h.svc.IncrementViews(id)

	app, err := h.svc.GetApp(id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, dto.Fail(404, "application not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(app))
}

// CreateApp handles POST /api/apps
func (h *AppMetaHandler) CreateApp(c *gin.Context) {
	var req dto.CreateAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}

	app, err := h.svc.CreateApp(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusCreated, dto.OK(app))
}

// UpdateApp handles PUT /api/apps/:id
func (h *AppMetaHandler) UpdateApp(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}

	app, err := h.svc.UpdateApp(id, req)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, dto.Fail(404, "application not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(app))
}

// DeleteApp handles DELETE /api/apps/:id
func (h *AppMetaHandler) DeleteApp(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteApp(id); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, dto.Fail(404, "application not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK[any](nil))
}

// PublishApp handles POST /api/apps/:id/publish
func (h *AppMetaHandler) PublishApp(c *gin.Context) {
	id := c.Param("id")
	app, err := h.svc.PublishApp(id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, dto.Fail(404, "application not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(app))
}

// UnpublishApp handles POST /api/apps/:id/unpublish
func (h *AppMetaHandler) UnpublishApp(c *gin.Context) {
	id := c.Param("id")
	app, err := h.svc.UnpublishApp(id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, dto.Fail(404, "application not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(app))
}
