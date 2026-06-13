package model

// ApiConfig holds configuration for calling an external API.
type ApiConfig struct {
	Provider    string            `json:"provider,omitempty"` // "runninghub" | "custom"
	Endpoint    string            `json:"endpoint"`
	Method      string            `json:"method"`
	Headers     map[string]string `json:"headers,omitempty"`
	FixedParams map[string]any    `json:"fixedParams,omitempty"`
	AuthType    string            `json:"authType,omitempty"`
	AuthKey     string            `json:"authKey,omitempty"`
	TimeoutMs   int               `json:"timeoutMs,omitempty"`
	ContentType string            `json:"contentType,omitempty"`
	// RunningHub specific
	InstanceType      string `json:"instanceType,omitempty"`
	UsePersonalQueue  string `json:"usePersonalQueue,omitempty"`
	Polling           *PollingConfig `json:"polling,omitempty"`
}

// PollingConfig describes polling behaviour for async API endpoints.
type PollingConfig struct {
	Enabled    bool   `json:"enabled"`
	IntervalMs int    `json:"intervalMs"`
	StatusPath string `json:"statusPath"`
	DoneValue  string `json:"doneValue"`
	ResultPath string `json:"resultPath"`
}

// InputField describes a single input widget on the application page.
type InputField struct {
	Name         string         `json:"name"`
	Label        string         `json:"label"`
	Type         string         `json:"type"`
	Required     bool           `json:"required,omitempty"`
	Placeholder  string         `json:"placeholder,omitempty"`
	DefaultValue any            `json:"defaultValue,omitempty"`
	Description  string         `json:"description,omitempty"`
	Options      []SelectOption `json:"options,omitempty"`
	Min          *float64       `json:"min,omitempty"`
	Max          *float64       `json:"max,omitempty"`
	Step         *float64       `json:"step,omitempty"`
	Accept       string         `json:"accept,omitempty"`
	Rows         int            `json:"rows,omitempty"`
	Width        string         `json:"width,omitempty"`
	ApiParamName string         `json:"apiParamName,omitempty"`
	// RunningHub node mapping
	NodeId    string `json:"nodeId,omitempty"`
	FieldName string `json:"fieldName,omitempty"`
}

// SelectOption is a label/value pair used in select / radio inputs.
type SelectOption struct {
	Label string `json:"label"`
	Value any    `json:"value"`
}

// OutputField describes a single output display widget.
type OutputField struct {
	Name         string `json:"name"`
	Label        string `json:"label"`
	Type         string `json:"type"`
	JsonPath     string `json:"jsonPath"`
	Description  string `json:"description,omitempty"`
	DownloadName string `json:"downloadName,omitempty"`
	Width        string `json:"width,omitempty"`
}

// PageLayout controls visual layout options for the application page.
type PageLayout struct {
	PrimaryColor string `json:"primaryColor,omitempty"`
	CoverImage   string `json:"coverImage,omitempty"`
	InputLayout  string `json:"inputLayout,omitempty"`
	OutputLayout string `json:"outputLayout,omitempty"`
	SubmitLabel  string `json:"submitLabel,omitempty"`
	LoadingLabel string `json:"loadingLabel,omitempty"`
}

// RunningHubNodeInfo is one item in the nodeInfoList sent to RunningHub API.
type RunningHubNodeInfo struct {
	NodeId      string `json:"nodeId"`
	FieldName   string `json:"fieldName"`
	FieldValue  any    `json:"fieldValue"`
	Description string `json:"description,omitempty"`
}

// RunningHubRequest is the full body sent to RunningHub /openapi/v2/run/ai-app/*.
type RunningHubRequest struct {
	NodeInfoList     []RunningHubNodeInfo `json:"nodeInfoList"`
	InstanceType     string               `json:"instanceType"`
	UsePersonalQueue string               `json:"usePersonalQueue"`
}
