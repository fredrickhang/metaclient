package model

import "time"

// RunRecord is the GORM model for the run_record table.
type RunRecord struct {
	ID          string     `gorm:"column:id;primaryKey;type:varchar(64)"`
	UserID      string     `gorm:"column:user_id;type:varchar(64);default:'';index"`
	AppID       string     `gorm:"column:app_id;type:varchar(64);not null;index"`
	AppName     string     `gorm:"column:app_name;type:varchar(255);not null;default:''"`
	AppCategory string     `gorm:"column:app_category;type:varchar(100);not null;default:''"`
	Status      string     `gorm:"column:status;type:text;check:status IN ('pending','running','success','failed');not null;default:'running'"`
	InputsJSON  string     `gorm:"column:inputs_json;type:jsonb"`
	OutputsJSON string     `gorm:"column:outputs_json;type:jsonb"`
	ResultText  string     `gorm:"column:result_text;type:text"`
	ErrorMsg    string     `gorm:"column:error_msg;type:text"`
	CreditsUsed int        `gorm:"column:credits_used;not null;default:0"`
	StartedAt   time.Time  `gorm:"column:started_at;autoCreateTime"`
	FinishedAt  *time.Time `gorm:"column:finished_at"`
	DurationMs  int64      `gorm:"column:duration_ms;not null;default:0"`
	ExpiresAt   *time.Time `gorm:"column:expires_at"`
}

func (RunRecord) TableName() string { return "run_record" }
