// Package mockdb provides in-memory implementations of all repository interfaces.
// Used when DB_DSN is empty so the server can be tested without a real database.
package mockdb

import (
	"appmeta-backend/internal/model"
	"appmeta-backend/internal/repository"
	"crypto/sha256"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
)

// ── helpers ──────────────────────────────────────────────

func sha256Hex(s string) string { return fmt.Sprintf("%x", sha256.Sum256([]byte(s))) }
func ptr[T any](v T) *T         { return &v }

// ── seed data ─────────────────────────────────────────────

func seedUsers() map[string]*model.User {
	now := time.Now()
	return map[string]*model.User{
		"u-admin": {ID: "u-admin", Username: "admin", DisplayName: "管理员", PasswordHash: sha256Hex("admin123"), Email: "admin@appmeta.com", Role: "admin", CreatedAt: now, UpdatedAt: now},
		"u-user":  {ID: "u-user", Username: "user", DisplayName: "普通用户", PasswordHash: sha256Hex("user123"), Email: "user@appmeta.com", Role: "user", CreatedAt: now, UpdatedAt: now},
		"u-demo":  {ID: "u-demo", Username: "demo", DisplayName: "Demo 用户", PasswordHash: sha256Hex("demo123"), Email: "demo@appmeta.com", Role: "user", CreatedAt: now, UpdatedAt: now},
	}
}

func seedCredits() map[string]*model.UserCredit {
	now := time.Now()
	return map[string]*model.UserCredit{
		"u-admin": {UserID: "u-admin", Credits: 9999, MembershipTier: "enterprise", MembershipExpiry: ptr(now.Add(365 * 24 * time.Hour)), UpdatedAt: now},
		"u-user":  {UserID: "u-user", Credits: 348, MembershipTier: "pro", MembershipExpiry: ptr(now.Add(18 * 24 * time.Hour)), UpdatedAt: now},
		"u-demo":  {UserID: "u-demo", Credits: 100, MembershipTier: "basic", MembershipExpiry: ptr(now.Add(30 * 24 * time.Hour)), UpdatedAt: now},
	}
}

func seedApps() []*model.AppMeta {
	now := time.Now()
	return []*model.AppMeta{
		{
			ID: "app-001", Name: "AI 图片生成", Description: "输入文字描述，自动生成高质量 AI 图片。",
			Category: "图像生成", TagsJSON: `["图片","AI生成","文生图"]`, Author: "李四", Status: "published",
			EstimatedCredits: 12,
			ApiConfigJSON:    `{"endpoint":"https://api.example.com/image/generate","method":"POST","contentType":"json","timeoutMs":60000}`,
			InputsJSON:       `[{"name":"prompt","label":"描述词","type":"textarea","required":true,"width":"full","apiParamName":"prompt"}]`,
			OutputsJSON:      `[{"name":"images","label":"生成结果","type":"image","jsonPath":"data.images","width":"full"}]`,
			LayoutConfigJSON: `{"primaryColor":"#7c3aed","submitLabel":"立即生成","loadingLabel":"生成中…"}`,
			RunCount: 52841, LikeCount: 8932, ViewCount: 234891, CreatedAt: now, UpdatedAt: now,
		},
		{
			ID: "app-002", Name: "智能文章摘要", Description: "粘贴任意长文章，AI 自动提取核心要点，生成结构化摘要。",
			Category: "文本处理", TagsJSON: `["摘要","NLP","文本","效率"]`, Author: "王五", Status: "published",
			EstimatedCredits: 5,
			ApiConfigJSON:    `{"endpoint":"https://api.example.com/text/summarize","method":"POST","contentType":"json","timeoutMs":30000}`,
			InputsJSON:       `[{"name":"text","label":"文章内容","type":"textarea","required":true,"rows":8,"width":"full","apiParamName":"text"}]`,
			OutputsJSON:      `[{"name":"summary","label":"文章摘要","type":"markdown","jsonPath":"data.summary","width":"full"}]`,
			LayoutConfigJSON: `{"primaryColor":"#0ea5e9","submitLabel":"生成摘要","loadingLabel":"分析中…"}`,
			RunCount: 76432, LikeCount: 12480, ViewCount: 318000, CreatedAt: now, UpdatedAt: now,
		},
		{
			ID: "app-003", Name: "代码注释生成", Description: "自动为代码添加专业注释，支持多种编程语言。",
			Category: "开发工具", TagsJSON: `["代码","注释","开发","效率"]`, Author: "赵六", Status: "published",
			EstimatedCredits: 3,
			ApiConfigJSON:    `{"endpoint":"https://api.example.com/code/comment","method":"POST","contentType":"json","timeoutMs":20000}`,
			InputsJSON:       `[{"name":"code","label":"代码片段","type":"textarea","required":true,"rows":10,"width":"full","apiParamName":"code"},{"name":"lang","label":"编程语言","type":"select","width":"half","options":[{"label":"Python","value":"python"},{"label":"Go","value":"go"},{"label":"JavaScript","value":"javascript"},{"label":"Java","value":"java"}]}]`,
			OutputsJSON:      `[{"name":"commented","label":"带注释的代码","type":"text","jsonPath":"data.commented","width":"full"}]`,
			LayoutConfigJSON: `{"primaryColor":"#10b981","submitLabel":"生成注释","loadingLabel":"分析中…"}`,
			RunCount: 31200, LikeCount: 5640, ViewCount: 98000, CreatedAt: now, UpdatedAt: now,
		},
	}
}

func seedRunRecords() []*model.RunRecord {
	now := time.Now()
	exp := now.Add(20 * time.Hour)
	return []*model.RunRecord{
		{ID: "r-001", UserID: "u-user", AppID: "app-001", AppName: "AI 图片生成", AppCategory: "图像生成", Status: "success", ResultText: "图片生成成功", CreditsUsed: 12, StartedAt: now.Add(-30 * time.Minute), DurationMs: 3200, ExpiresAt: &exp},
		{ID: "r-002", UserID: "u-user", AppID: "app-002", AppName: "智能文章摘要", AppCategory: "文本处理", Status: "success", ResultText: "摘要生成完成", CreditsUsed: 5, StartedAt: now.Add(-2 * time.Hour), DurationMs: 1800, ExpiresAt: &exp},
		{ID: "r-003", UserID: "u-user", AppID: "app-003", AppName: "代码注释生成", AppCategory: "开发工具", Status: "failed", ErrorMsg: "请求超时", CreditsUsed: 0, StartedAt: now.Add(-5 * time.Hour), DurationMs: 20000},
		{ID: "r-004", UserID: "u-admin", AppID: "app-001", AppName: "AI 图片生成", AppCategory: "图像生成", Status: "success", ResultText: "管理员测试成功", CreditsUsed: 12, StartedAt: now.Add(-1 * time.Hour), DurationMs: 2900, ExpiresAt: &exp},
	}
}

func seedPayments() []*model.PaymentRecord {
	now := time.Now()
	return []*model.PaymentRecord{
		{ID: "pay-001", UserID: "u-user", OrderID: "ORD-001", Type: "credits", Description: "积分充值 · 100积分", Amount: 9.9, Status: "paid", CreditsAdded: 100, CreatedAt: now.Add(-72 * time.Hour)},
		{ID: "pay-002", UserID: "u-user", OrderID: "ORD-002", Type: "membership", Description: "Pro 会员 · 月订阅", Amount: 39.9, Status: "paid", TierID: "pro", CreatedAt: now.Add(-20 * 24 * time.Hour)},
		{ID: "pay-003", UserID: "u-admin", OrderID: "ORD-003", Type: "membership", Description: "Enterprise 会员 · 年订阅", Amount: 999, Status: "paid", TierID: "enterprise", CreatedAt: now.Add(-30 * 24 * time.Hour)},
	}
}

// ── MockUserRepository ────────────────────────────────────

type MockUserRepository struct {
	mu      sync.RWMutex
	byID    map[string]*model.User
	byName  map[string]*model.User
}

func NewMockUserRepository() repository.UserRepository {
	r := &MockUserRepository{byID: make(map[string]*model.User), byName: make(map[string]*model.User)}
	for id, u := range seedUsers() {
		r.byID[id] = u
		r.byName[u.Username] = u
	}
	return r
}

func (r *MockUserRepository) FindByUsername(username string) (*model.User, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	u, ok := r.byName[username]
	if !ok { return nil, gorm.ErrRecordNotFound }
	cp := *u; return &cp, nil
}

func (r *MockUserRepository) FindByID(id string) (*model.User, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	u, ok := r.byID[id]
	if !ok { return nil, gorm.ErrRecordNotFound }
	cp := *u; return &cp, nil
}

func (r *MockUserRepository) Create(u *model.User) error {
	r.mu.Lock(); defer r.mu.Unlock()
	if _, exists := r.byName[u.Username]; exists {
		return errors.New("username already exists")
	}
	u.CreatedAt = time.Now(); u.UpdatedAt = time.Now()
	cp := *u
	r.byID[u.ID] = &cp
	r.byName[u.Username] = &cp
	return nil
}

func (r *MockUserRepository) Update(u *model.User) error {
	r.mu.Lock(); defer r.mu.Unlock()
	u.UpdatedAt = time.Now()
	cp := *u
	r.byID[u.ID] = &cp
	r.byName[u.Username] = &cp
	return nil
}

// ── MockAuthTokenRepository ───────────────────────────────

type MockAuthTokenRepository struct {
	mu     sync.RWMutex
	tokens map[string]*model.AuthToken
}

func NewMockAuthTokenRepository() repository.AuthTokenRepository {
	return &MockAuthTokenRepository{tokens: make(map[string]*model.AuthToken)}
}

func (r *MockAuthTokenRepository) Create(t *model.AuthToken) error {
	r.mu.Lock(); defer r.mu.Unlock()
	t.CreatedAt = time.Now()
	cp := *t; r.tokens[t.Token] = &cp
	return nil
}

func (r *MockAuthTokenRepository) FindByToken(token string) (*model.AuthToken, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	t, ok := r.tokens[token]
	if !ok { return nil, gorm.ErrRecordNotFound }
	cp := *t; return &cp, nil
}

func (r *MockAuthTokenRepository) Delete(token string) error {
	r.mu.Lock(); defer r.mu.Unlock()
	delete(r.tokens, token); return nil
}

func (r *MockAuthTokenRepository) DeleteExpired() error {
	r.mu.Lock(); defer r.mu.Unlock()
	now := time.Now()
	for k, t := range r.tokens {
		if t.ExpiresAt.Before(now) { delete(r.tokens, k) }
	}
	return nil
}

// ── MockUserCreditRepository ──────────────────────────────

type MockUserCreditRepository struct {
	mu      sync.RWMutex
	credits map[string]*model.UserCredit
}

func NewMockUserCreditRepository() repository.UserCreditRepository {
	r := &MockUserCreditRepository{credits: make(map[string]*model.UserCredit)}
	for id, c := range seedCredits() { r.credits[id] = c }
	return r
}

func (r *MockUserCreditRepository) FindByUserID(userID string) (*model.UserCredit, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	c, ok := r.credits[userID]
	if !ok { return nil, gorm.ErrRecordNotFound }
	cp := *c; return &cp, nil
}

func (r *MockUserCreditRepository) Upsert(c *model.UserCredit) error {
	r.mu.Lock(); defer r.mu.Unlock()
	c.UpdatedAt = time.Now(); cp := *c; r.credits[c.UserID] = &cp; return nil
}

func (r *MockUserCreditRepository) AddCredits(userID string, delta int) error {
	r.mu.Lock(); defer r.mu.Unlock()
	c, ok := r.credits[userID]
	if !ok { r.credits[userID] = &model.UserCredit{UserID: userID, Credits: delta, UpdatedAt: time.Now()}; return nil }
	c.Credits += delta; c.UpdatedAt = time.Now(); return nil
}

func (r *MockUserCreditRepository) DeductCredits(userID string, amount int) error {
	r.mu.Lock(); defer r.mu.Unlock()
	c, ok := r.credits[userID]
	if !ok || c.Credits < amount { return errors.New("insufficient credits") }
	c.Credits -= amount; c.UpdatedAt = time.Now(); return nil
}

// ── MockAppMetaRepository ─────────────────────────────────

type MockAppMetaRepository struct {
	mu   sync.RWMutex
	apps []*model.AppMeta
}

func NewMockAppMetaRepository() repository.AppMetaRepository {
	r := &MockAppMetaRepository{}
	r.apps = seedApps()
	return r
}

func (r *MockAppMetaRepository) FindAll(status, category, keyword string) ([]model.AppMeta, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	var result []model.AppMeta
	for _, a := range r.apps {
		if status != "" && a.Status != status { continue }
		if category != "" && a.Category != category { continue }
		if keyword != "" && !strings.Contains(a.Name, keyword) && !strings.Contains(a.Description, keyword) { continue }
		result = append(result, *a)
	}
	return result, nil
}

func (r *MockAppMetaRepository) FindByID(id string) (*model.AppMeta, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	for _, a := range r.apps {
		if a.ID == id { cp := *a; return &cp, nil }
	}
	return nil, gorm.ErrRecordNotFound
}

func (r *MockAppMetaRepository) Create(app *model.AppMeta) error {
	r.mu.Lock(); defer r.mu.Unlock()
	app.CreatedAt = time.Now(); app.UpdatedAt = time.Now()
	cp := *app; r.apps = append([]*model.AppMeta{&cp}, r.apps...); return nil
}

func (r *MockAppMetaRepository) Update(app *model.AppMeta) error {
	r.mu.Lock(); defer r.mu.Unlock()
	app.UpdatedAt = time.Now()
	for i, a := range r.apps {
		if a.ID == app.ID { cp := *app; r.apps[i] = &cp; return nil }
	}
	return gorm.ErrRecordNotFound
}

func (r *MockAppMetaRepository) Delete(id string) error {
	r.mu.Lock(); defer r.mu.Unlock()
	for i, a := range r.apps {
		if a.ID == id { r.apps = append(r.apps[:i], r.apps[i+1:]...); return nil }
	}
	return gorm.ErrRecordNotFound
}

func (r *MockAppMetaRepository) IncrementRunCount(id string) error {
	r.mu.Lock(); defer r.mu.Unlock()
	for _, a := range r.apps { if a.ID == id { a.RunCount++; return nil } }
	return nil
}

func (r *MockAppMetaRepository) IncrementViewCount(id string) error {
	r.mu.Lock(); defer r.mu.Unlock()
	for _, a := range r.apps { if a.ID == id { a.ViewCount++; return nil } }
	return nil
}

// ── MockRunRecordRepository ───────────────────────────────

type MockRunRecordRepository struct {
	mu      sync.RWMutex
	records []*model.RunRecord
}

func NewMockRunRecordRepository() repository.RunRecordRepository {
	r := &MockRunRecordRepository{}
	r.records = seedRunRecords()
	return r
}

func (r *MockRunRecordRepository) Create(rec *model.RunRecord) error {
	r.mu.Lock(); defer r.mu.Unlock()
	rec.StartedAt = time.Now(); cp := *rec
	r.records = append([]*model.RunRecord{&cp}, r.records...); return nil
}

func (r *MockRunRecordRepository) Update(rec *model.RunRecord) error {
	r.mu.Lock(); defer r.mu.Unlock()
	for i, rr := range r.records {
		if rr.ID == rec.ID { cp := *rec; r.records[i] = &cp; return nil }
	}
	return gorm.ErrRecordNotFound
}

func (r *MockRunRecordRepository) FindByID(id string) (*model.RunRecord, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	for _, rr := range r.records {
		if rr.ID == id { cp := *rr; return &cp, nil }
	}
	return nil, gorm.ErrRecordNotFound
}

func (r *MockRunRecordRepository) FindByAppID(appID string) ([]model.RunRecord, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	var result []model.RunRecord
	for _, rr := range r.records { if rr.AppID == appID { result = append(result, *rr) } }
	return result, nil
}

func (r *MockRunRecordRepository) FindByUserID(userID string) ([]model.RunRecord, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	var result []model.RunRecord
	for _, rr := range r.records { if rr.UserID == userID { result = append(result, *rr) } }
	return result, nil
}

// ── MockPaymentRepository ─────────────────────────────────

type MockPaymentRepository struct {
	mu       sync.RWMutex
	payments []*model.PaymentRecord
}

func NewMockPaymentRepository() repository.PaymentRepository {
	r := &MockPaymentRepository{}
	r.payments = seedPayments()
	return r
}

func (r *MockPaymentRepository) FindByUserID(userID string) ([]model.PaymentRecord, error) {
	r.mu.RLock(); defer r.mu.RUnlock()
	var result []model.PaymentRecord
	for _, p := range r.payments { if p.UserID == userID { result = append(result, *p) } }
	return result, nil
}

func (r *MockPaymentRepository) Create(p *model.PaymentRecord) error {
	r.mu.Lock(); defer r.mu.Unlock()
	p.CreatedAt = time.Now(); cp := *p
	r.payments = append([]*model.PaymentRecord{&cp}, r.payments...); return nil
}
