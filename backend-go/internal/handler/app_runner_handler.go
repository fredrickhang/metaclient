package handler

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AppRunnerHandler handles HTTP requests for running applications.
type AppRunnerHandler struct {
	svc service.AppRunnerService
}

// NewAppRunnerHandler constructs a new AppRunnerHandler.
func NewAppRunnerHandler(svc service.AppRunnerService) *AppRunnerHandler {
	return &AppRunnerHandler{svc: svc}
}

// RunApp handles POST /api/runner/run
func (h *AppRunnerHandler) RunApp(c *gin.Context) {
	var req dto.RunAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.Fail(400, err.Error()))
		return
	}

	result, err := h.svc.RunApp(req)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, dto.Fail(404, "application not found"))
			return
		}
		// Return the run result even on failure so the client can inspect it.
		if result != nil {
			c.JSON(http.StatusOK, dto.OK(result))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(result))
}

// GetRunRecord handles GET /api/runner/runs/:runId
func (h *AppRunnerHandler) GetRunRecord(c *gin.Context) {
	runID := c.Param("runId")
	record, err := h.svc.GetRunRecord(runID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, dto.Fail(404, "run record not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(record))
}

// ListRunRecords handles GET /api/runner/apps/:appId/runs
func (h *AppRunnerHandler) ListRunRecords(c *gin.Context) {
	appID := c.Param("appId")
	records, err := h.svc.ListRunRecords(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.Fail(500, err.Error()))
		return
	}
	c.JSON(http.StatusOK, dto.OK(records))
}
