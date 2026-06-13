package service

import (
	"appmeta-backend/internal/dto"
	"appmeta-backend/internal/model"
	"appmeta-backend/internal/repository"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AppRunnerService defines the business-logic contract for running applications.
type AppRunnerService interface {
	RunApp(req dto.RunAppRequest) (*dto.RunResultResponse, error)
	GetRunRecord(runID string) (*dto.RunResultResponse, error)
	ListRunRecords(appID string) ([]dto.RunResultResponse, error)
}

type appRunnerServiceImpl struct {
	appRepo repository.AppMetaRepository
	runRepo repository.RunRecordRepository
}

// NewAppRunnerService constructs a new AppRunnerService.
func NewAppRunnerService(appRepo repository.AppMetaRepository, runRepo repository.RunRecordRepository) AppRunnerService {
	return &appRunnerServiceImpl{appRepo: appRepo, runRepo: runRepo}
}

// ---------- public methods ----------

func (s *appRunnerServiceImpl) RunApp(req dto.RunAppRequest) (*dto.RunResultResponse, error) {
	// 1. Fetch the application.
	app, err := s.appRepo.FindByID(req.AppID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// 2. Parse api_config.
	if app.ApiConfigJSON == "" || app.ApiConfigJSON == "null" {
		return nil, fmt.Errorf("app has no api_config")
	}
	var apiCfg model.ApiConfig
	if err := json.Unmarshal([]byte(app.ApiConfigJSON), &apiCfg); err != nil {
		return nil, fmt.Errorf("invalid api_config: %w", err)
	}

	// 3. Create RunRecord with status=running.
	inputsBytes, _ := json.Marshal(req.Inputs)
	startedAt := time.Now()
	record := &model.RunRecord{
		ID:         uuid.New().String(),
		AppID:      req.AppID,
		Status:     "running",
		InputsJSON: string(inputsBytes),
		StartedAt:  startedAt,
	}
	if err := s.runRepo.Create(record); err != nil {
		return nil, err
	}

	// Parse input field definitions (needed for RunningHub node mapping).
	var inputFields []model.InputField
	if app.InputsJSON != "" && app.InputsJSON != "null" {
		_ = json.Unmarshal([]byte(app.InputsJSON), &inputFields)
	}

	// Execute the call: route by provider.
	var outputs map[string]any
	var callErr error
	if strings.EqualFold(apiCfg.Provider, "runninghub") {
		outputs, callErr = s.callRunningHub(apiCfg, inputFields, req.Inputs)
	} else {
		outputs, callErr = s.callExternalAPI(apiCfg, req.Inputs)
	}

	finishedAt := time.Now()
	durationMs := finishedAt.Sub(startedAt).Milliseconds()
	record.FinishedAt = &finishedAt
	record.DurationMs = durationMs

	if callErr != nil {
		record.Status = "failed"
		record.ErrorMsg = callErr.Error()
	} else {
		record.Status = "success"
		outBytes, _ := json.Marshal(outputs)
		record.OutputsJSON = string(outBytes)
	}

	// 9. Persist the updated record.
	if updateErr := s.runRepo.Update(record); updateErr != nil {
		// Log-worthy but do not override the primary error.
		_ = updateErr
	}

	// 10. Increment run count (best-effort).
	_ = s.appRepo.IncrementRunCount(req.AppID)

	// 11. Build and return the response.
	resp := recordToResponse(record)
	resp.Outputs = outputs
	return resp, callErr
}

func (s *appRunnerServiceImpl) GetRunRecord(runID string) (*dto.RunResultResponse, error) {
	rec, err := s.runRepo.FindByID(runID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	resp := recordToResponse(rec)
	if rec.OutputsJSON != "" && rec.OutputsJSON != "null" {
		var out map[string]any
		if jsonErr := json.Unmarshal([]byte(rec.OutputsJSON), &out); jsonErr == nil {
			resp.Outputs = out
		}
	}
	return resp, nil
}

func (s *appRunnerServiceImpl) ListRunRecords(appID string) ([]dto.RunResultResponse, error) {
	records, err := s.runRepo.FindByAppID(appID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.RunResultResponse, 0, len(records))
	for _, rec := range records {
		resp := recordToResponse(&rec)
		if rec.OutputsJSON != "" && rec.OutputsJSON != "null" {
			var out map[string]any
			if jsonErr := json.Unmarshal([]byte(rec.OutputsJSON), &out); jsonErr == nil {
				resp.Outputs = out
			}
		}
		result = append(result, *resp)
	}
	return result, nil
}

// ---------- internal helpers ----------

// callRunningHub builds a RunningHub nodeInfoList request from user inputs + field config.
func (s *appRunnerServiceImpl) callRunningHub(apiCfg model.ApiConfig, inputFields []model.InputField, userInputs map[string]any) (map[string]any, error) {
	// Build nodeInfoList: one entry per input field that has nodeId configured.
	nodeInfoList := make([]model.RunningHubNodeInfo, 0, len(inputFields))
	for _, f := range inputFields {
		if f.NodeId == "" {
			continue
		}
		fieldValue, ok := userInputs[f.Name]
		if !ok {
			fieldValue = f.DefaultValue
		}
		nodeInfoList = append(nodeInfoList, model.RunningHubNodeInfo{
			NodeId:      f.NodeId,
			FieldName:   f.FieldName,
			FieldValue:  fieldValue,
			Description: f.Description,
		})
	}

	instanceType := apiCfg.InstanceType
	if instanceType == "" {
		instanceType = "default"
	}
	usePersonalQueue := apiCfg.UsePersonalQueue
	if usePersonalQueue == "" {
		usePersonalQueue = "false"
	}

	reqBody := model.RunningHubRequest{
		NodeInfoList:     nodeInfoList,
		InstanceType:     instanceType,
		UsePersonalQueue: usePersonalQueue,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal RunningHub request: %w", err)
	}

	timeout := time.Duration(apiCfg.TimeoutMs) * time.Millisecond
	if timeout <= 0 {
		timeout = 60 * time.Second
	}
	client := &http.Client{Timeout: timeout}

	httpReq, err := http.NewRequest("POST", apiCfg.Endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to build RunningHub request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	// Auth: prefer per-app authKey, fallback to RUNNINGHUB_API_KEY env var.
	apiKey := apiCfg.AuthKey
	if apiKey == "" {
		apiKey = os.Getenv("RUNNINGHUB_API_KEY")
	}
	if apiKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("RunningHub request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read RunningHub response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("RunningHub returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var result map[string]any
	if jsonErr := json.Unmarshal(respBody, &result); jsonErr != nil {
		result = map[string]any{"raw": string(respBody)}
	}
	return result, nil
}

// callExternalAPI builds and executes the HTTP request described by apiCfg.
func (s *appRunnerServiceImpl) callExternalAPI(apiCfg model.ApiConfig, userInputs map[string]any) (map[string]any, error) {
	// 4. Merge fixedParams with user inputs (user inputs take precedence).
	params := make(map[string]any)
	for k, v := range apiCfg.FixedParams {
		params[k] = v
	}
	for k, v := range userInputs {
		params[k] = v
	}

	method := strings.ToUpper(apiCfg.Method)
	if method == "" {
		method = "POST"
	}

	timeout := time.Duration(apiCfg.TimeoutMs) * time.Millisecond
	if timeout <= 0 {
		timeout = 30 * time.Second
	}
	client := &http.Client{Timeout: timeout}

	var httpReq *http.Request
	var buildErr error

	contentType := strings.ToLower(apiCfg.ContentType)

	switch method {
	case "GET", "DELETE":
		// Append params to query string.
		u, err := url.Parse(apiCfg.Endpoint)
		if err != nil {
			return nil, fmt.Errorf("invalid endpoint URL: %w", err)
		}
		q := u.Query()
		for k, v := range params {
			q.Set(k, fmt.Sprintf("%v", v))
		}
		u.RawQuery = q.Encode()
		httpReq, buildErr = http.NewRequest(method, u.String(), nil)

	case "POST", "PUT", "PATCH":
		switch {
		case contentType == "multipart/form-data":
			var buf bytes.Buffer
			w := multipart.NewWriter(&buf)
			for k, v := range params {
				_ = w.WriteField(k, fmt.Sprintf("%v", v))
			}
			w.Close()
			httpReq, buildErr = http.NewRequest(method, apiCfg.Endpoint, &buf)
			if buildErr == nil {
				httpReq.Header.Set("Content-Type", w.FormDataContentType())
			}

		case contentType == "application/x-www-form-urlencoded":
			form := url.Values{}
			for k, v := range params {
				form.Set(k, fmt.Sprintf("%v", v))
			}
			httpReq, buildErr = http.NewRequest(method, apiCfg.Endpoint, strings.NewReader(form.Encode()))
			if buildErr == nil {
				httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			}

		default:
			// Default: application/json
			body, err := json.Marshal(params)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal request body: %w", err)
			}
			httpReq, buildErr = http.NewRequest(method, apiCfg.Endpoint, bytes.NewReader(body))
			if buildErr == nil {
				httpReq.Header.Set("Content-Type", "application/json")
			}
		}

	default:
		return nil, fmt.Errorf("unsupported HTTP method: %s", method)
	}

	if buildErr != nil {
		return nil, fmt.Errorf("failed to build HTTP request: %w", buildErr)
	}

	// 5. Set custom headers.
	for k, v := range apiCfg.Headers {
		httpReq.Header.Set(k, v)
	}

	// Set authentication header.
	switch strings.ToLower(apiCfg.AuthType) {
	case "bearer":
		httpReq.Header.Set("Authorization", "Bearer "+apiCfg.AuthKey)
	case "apikey":
		httpReq.Header.Set("X-Api-Key", apiCfg.AuthKey)
	case "basic":
		httpReq.Header.Set("Authorization", "Basic "+apiCfg.AuthKey)
	}

	// 7. Execute the request.
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	// 8. Read and parse the response.
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("upstream returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		// Not JSON — wrap raw body.
		result = map[string]any{"raw": string(respBody)}
	}

	return result, nil
}

// recordToResponse converts a model.RunRecord to a dto.RunResultResponse.
func recordToResponse(rec *model.RunRecord) *dto.RunResultResponse {
	return &dto.RunResultResponse{
		RunID:      rec.ID,
		AppID:      rec.AppID,
		Status:     rec.Status,
		ErrorMsg:   rec.ErrorMsg,
		DurationMs: rec.DurationMs,
		StartedAt:  rec.StartedAt,
		FinishedAt: rec.FinishedAt,
	}
}
