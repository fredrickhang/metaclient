package dto

// CreateAppRequest is the body payload for creating a new application.
type CreateAppRequest struct {
	Name         string         `json:"name" binding:"required"`
	Description  string         `json:"description"`
	Category     string         `json:"category"`
	Tags         []string       `json:"tags"`
	Author       string         `json:"author"`
	ApiConfig    *ApiConfigDTO  `json:"apiConfig"`
	Inputs       []InputFieldDTO  `json:"inputs"`
	Outputs      []OutputFieldDTO `json:"outputs"`
	LayoutConfig *PageLayoutDTO `json:"layoutConfig"`
}

// UpdateAppRequest is the body payload for updating an existing application.
// All fields are optional; only non-zero values should overwrite existing data.
type UpdateAppRequest struct {
	Name         string         `json:"name"`
	Description  string         `json:"description"`
	Category     string         `json:"category"`
	Tags         []string       `json:"tags"`
	Author       string         `json:"author"`
	ApiConfig    *ApiConfigDTO  `json:"apiConfig"`
	Inputs       []InputFieldDTO  `json:"inputs"`
	Outputs      []OutputFieldDTO `json:"outputs"`
	LayoutConfig *PageLayoutDTO `json:"layoutConfig"`
}

// RunAppRequest carries the user-supplied inputs for a single application run.
type RunAppRequest struct {
	AppID  string         `json:"appId" binding:"required"`
	Inputs map[string]any `json:"inputs"`
}

// --- nested DTO types used by CreateAppRequest / UpdateAppRequest ---

// ApiConfigDTO mirrors model.ApiConfig for request binding.
type ApiConfigDTO struct {
	Endpoint    string            `json:"endpoint"`
	Method      string            `json:"method"`
	Headers     map[string]string `json:"headers,omitempty"`
	FixedParams map[string]any    `json:"fixedParams,omitempty"`
	AuthType    string            `json:"authType,omitempty"`
	AuthKey     string            `json:"authKey,omitempty"`
	TimeoutMs   int               `json:"timeoutMs,omitempty"`
	ContentType string            `json:"contentType,omitempty"`
	Polling     *PollingConfigDTO `json:"polling,omitempty"`
}

// PollingConfigDTO mirrors model.PollingConfig for request binding.
type PollingConfigDTO struct {
	Enabled    bool   `json:"enabled"`
	IntervalMs int    `json:"intervalMs"`
	StatusPath string `json:"statusPath"`
	DoneValue  string `json:"doneValue"`
	ResultPath string `json:"resultPath"`
}

// InputFieldDTO mirrors model.InputField for request binding.
type InputFieldDTO struct {
	Name         string            `json:"name"`
	Label        string            `json:"label"`
	Type         string            `json:"type"`
	Required     bool              `json:"required,omitempty"`
	Placeholder  string            `json:"placeholder,omitempty"`
	DefaultValue any               `json:"defaultValue,omitempty"`
	Description  string            `json:"description,omitempty"`
	Options      []SelectOptionDTO `json:"options,omitempty"`
	Min          *float64          `json:"min,omitempty"`
	Max          *float64          `json:"max,omitempty"`
	Step         *float64          `json:"step,omitempty"`
	Accept       string            `json:"accept,omitempty"`
	Rows         int               `json:"rows,omitempty"`
	Width        string            `json:"width,omitempty"`
	ApiParamName string            `json:"apiParamName,omitempty"`
}

// SelectOptionDTO mirrors model.SelectOption for request binding.
type SelectOptionDTO struct {
	Label string `json:"label"`
	Value any    `json:"value"`
}

// OutputFieldDTO mirrors model.OutputField for request binding.
type OutputFieldDTO struct {
	Name         string `json:"name"`
	Label        string `json:"label"`
	Type         string `json:"type"`
	JsonPath     string `json:"jsonPath"`
	Description  string `json:"description,omitempty"`
	DownloadName string `json:"downloadName,omitempty"`
	Width        string `json:"width,omitempty"`
}

// PageLayoutDTO mirrors model.PageLayout for request binding.
type PageLayoutDTO struct {
	PrimaryColor string `json:"primaryColor,omitempty"`
	CoverImage   string `json:"coverImage,omitempty"`
	InputLayout  string `json:"inputLayout,omitempty"`
	OutputLayout string `json:"outputLayout,omitempty"`
	SubmitLabel  string `json:"submitLabel,omitempty"`
	LoadingLabel string `json:"loadingLabel,omitempty"`
}

// ── Auth ──────────────────────────────────────────────────

// LoginRequest is the body payload for POST /api/auth/login.
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest is the body payload for POST /api/auth/register.
type RegisterRequest struct {
	Username    string `json:"username"    binding:"required,min=3,max=32"`
	Password    string `json:"password"    binding:"required,min=6"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
}

// ── User / Account ────────────────────────────────────────

// UpdateAccountRequest is the body payload for PUT /api/user/account.
type UpdateAccountRequest struct {
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
}

// ChangePasswordRequest is the body payload for PUT /api/user/password.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword"     binding:"required,min=8"`
}

// ── Payment ───────────────────────────────────────────────

// CreatePaymentRequest is the body payload for POST /api/payments.
type CreatePaymentRequest struct {
	Type         string  `json:"type"        binding:"required,oneof=membership credits"`
	Description  string  `json:"description" binding:"required"`
	Amount       float64 `json:"amount"      binding:"required,gt=0"`
	CreditsToAdd int     `json:"creditsToAdd"`
	TierID       string  `json:"tierId"`
}

// ── Run Record ────────────────────────────────────────────

// CreateRunRecordRequest is the body payload for POST /api/records.
type CreateRunRecordRequest struct {
	AppID       string `json:"appId"       binding:"required"`
	AppName     string `json:"appName"`
	AppCategory string `json:"appCategory"`
}

// UpdateRunRecordRequest is the body payload for PUT /api/records/:id.
type UpdateRunRecordRequest struct {
	Status      string `json:"status"`
	ResultText  string `json:"resultText"`
	ErrorMsg    string `json:"errorMsg"`
	CreditsUsed int    `json:"creditsUsed"`
	DurationMs  int64  `json:"durationMs"`
}
