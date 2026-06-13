package dto

import "time"

// ApiResponse is the unified HTTP response envelope used by all endpoints.
type ApiResponse[T any] struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

// OK constructs a successful ApiResponse.
func OK[T any](data T) ApiResponse[T] {
	return ApiResponse[T]{Code: 200, Message: "success", Data: data}
}

// Fail constructs an error ApiResponse with a nil data field.
func Fail(code int, message string) ApiResponse[any] {
	return ApiResponse[any]{Code: code, Message: message, Data: nil}
}

// AppMetaResponse is the front-end facing representation of an application.
type AppMetaResponse struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Category     string            `json:"category"`
	Tags         []string          `json:"tags"`
	Author       string            `json:"author"`
	Status       string            `json:"status"`
	ApiConfig    *ApiConfigDTO     `json:"apiConfig"`
	Inputs       []InputFieldDTO   `json:"inputs"`
	Outputs      []OutputFieldDTO  `json:"outputs"`
	LayoutConfig *PageLayoutDTO    `json:"layoutConfig"`
	RunCount     int               `json:"runCount"`
	LikeCount    int               `json:"likeCount"`
	ViewCount    int               `json:"viewCount"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}

// RunResultResponse is returned after executing an application run.
type RunResultResponse struct {
	RunID      string         `json:"runId"`
	AppID      string         `json:"appId"`
	Status     string         `json:"status"`
	Outputs    map[string]any `json:"outputs"`
	ErrorMsg   string         `json:"errorMsg,omitempty"`
	DurationMs int64          `json:"durationMs"`
	StartedAt  time.Time      `json:"startedAt"`
	FinishedAt *time.Time     `json:"finishedAt"`
}

// StatsResponse carries aggregate statistics for a single application.
type StatsResponse struct {
	AppID     string `json:"appId"`
	RunCount  int    `json:"runCount"`
	LikeCount int    `json:"likeCount"`
	ViewCount int    `json:"viewCount"`
}

// ── Auth ──────────────────────────────────────────────────

// LoginResponse is returned after a successful login.
type LoginResponse struct {
	Token string      `json:"token"`
	User  UserInfoDTO `json:"user"`
}

// UserInfoDTO is a safe (no password) user representation.
type UserInfoDTO struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Role        string `json:"role"`
	Avatar      string `json:"avatar"`
	CreatedAt   string `json:"createdAt"`
}

// ── User meta ─────────────────────────────────────────────

// UserMetaResponse wraps credits and membership info.
type UserMetaResponse struct {
	Credits          int     `json:"credits"`
	MembershipTier   string  `json:"membershipTier"`
	MembershipExpiry *string `json:"membershipExpiry"`
}

// ── Payment ───────────────────────────────────────────────

// PaymentRecordResponse is the front-end facing representation of a payment.
type PaymentRecordResponse struct {
	ID          string  `json:"id"`
	OrderID     string  `json:"orderId"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"createdAt"`
}

// ── Run Record ────────────────────────────────────────────

// RunRecordResponse is the front-end facing representation of a run record.
type RunRecordResponse struct {
	ID          string  `json:"id"`
	AppID       string  `json:"appId"`
	AppName     string  `json:"appName"`
	AppCategory string  `json:"appCategory"`
	Status      string  `json:"status"`
	ResultText  string  `json:"result,omitempty"`
	ErrorMsg    string  `json:"errorMsg,omitempty"`
	CreditsUsed int     `json:"creditsUsed"`
	DurationMs  int64   `json:"durationMs"`
	CreatedAt   string  `json:"createdAt"`
	ExpiresAt   *string `json:"expiresAt"`
}
