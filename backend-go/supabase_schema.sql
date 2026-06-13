-- ============================================================
-- AppMeta 数据库建表脚本 (PostgreSQL / Supabase)
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本
-- ============================================================

-- ── 用户表 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(64)  PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    display_name  VARCHAR(128) NOT NULL DEFAULT '',
    password_hash VARCHAR(128) NOT NULL,
    email         VARCHAR(255) NOT NULL DEFAULT '',
    phone         VARCHAR(20)  NOT NULL DEFAULT '',
    role          TEXT         NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar        VARCHAR(512) NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 认证 Token 表 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_tokens (
    token      VARCHAR(128) PRIMARY KEY,
    user_id    VARCHAR(64)  NOT NULL,
    role       VARCHAR(20)  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id    ON auth_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens (expires_at);

-- ── 用户积分 & 会员表 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_credits (
    user_id           VARCHAR(64) PRIMARY KEY,
    credits           INTEGER     NOT NULL DEFAULT 0,
    membership_tier   VARCHAR(32) NOT NULL DEFAULT '',
    membership_expiry TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 应用元数据表 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_meta (
    id                VARCHAR(64)  PRIMARY KEY,
    name              TEXT         NOT NULL,
    description       TEXT         NOT NULL DEFAULT '',
    category          TEXT         NOT NULL DEFAULT '',
    tags              JSONB        NOT NULL DEFAULT '[]',
    author            TEXT         NOT NULL DEFAULT '',
    status            TEXT         NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    api_config        JSONB        NOT NULL DEFAULT '{}',
    inputs            JSONB        NOT NULL DEFAULT '[]',
    outputs           JSONB        NOT NULL DEFAULT '[]',
    layout_config     JSONB        NOT NULL DEFAULT '{}',
    estimated_credits INTEGER      NOT NULL DEFAULT 0,
    run_count         INTEGER      NOT NULL DEFAULT 0,
    like_count        INTEGER      NOT NULL DEFAULT 0,
    view_count        INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 运行记录表 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS run_record (
    id           VARCHAR(64)  PRIMARY KEY,
    user_id      VARCHAR(64)  NOT NULL DEFAULT '',
    app_id       VARCHAR(64)  NOT NULL,
    app_name     VARCHAR(255) NOT NULL DEFAULT '',
    app_category VARCHAR(100) NOT NULL DEFAULT '',
    status       TEXT         NOT NULL DEFAULT 'running' CHECK (status IN ('pending', 'running', 'success', 'failed')),
    inputs_json  JSONB        NOT NULL DEFAULT '{}',
    outputs_json JSONB        NOT NULL DEFAULT '{}',
    result_text  TEXT         NOT NULL DEFAULT '',
    error_msg    TEXT         NOT NULL DEFAULT '',
    credits_used INTEGER      NOT NULL DEFAULT 0,
    started_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finished_at  TIMESTAMPTZ,
    duration_ms  BIGINT       NOT NULL DEFAULT 0,
    expires_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_run_record_user_id ON run_record (user_id);
CREATE INDEX IF NOT EXISTS idx_run_record_app_id  ON run_record (app_id);

-- ── 支付记录表 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_records (
    id            VARCHAR(64)    PRIMARY KEY,
    user_id       VARCHAR(64)    NOT NULL,
    order_id      VARCHAR(64)    NOT NULL UNIQUE,
    type          TEXT           NOT NULL CHECK (type IN ('membership', 'credits')),
    description   VARCHAR(255)   NOT NULL DEFAULT '',
    amount        NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status        TEXT           NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'refunded')),
    credits_added INTEGER        NOT NULL DEFAULT 0,
    tier_id       VARCHAR(32)    NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records (user_id);

-- ============================================================
-- 种子数据：三个演示账号（密码均为 sha256 摘要）
-- admin123 → 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a
-- user123  → 12dea96fec20593566ab75692c9949596833adc9
-- ============================================================

INSERT INTO users (id, username, display_name, password_hash, email, role) VALUES
  ('u-admin', 'admin', '管理员',   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@appmeta.com', 'admin'),
  ('u-user',  'user',  '普通用户', 'e606e38b0d8c19b24cf0ee3808183162ea7cd63ff7912dbb22b5e803286b4446',  'user@appmeta.com',  'user'),
  ('u-demo',  'demo',  'Demo 用户','d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',  'demo@appmeta.com',  'user')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_credits (user_id, credits, membership_tier, membership_expiry) VALUES
  ('u-admin', 9999, 'enterprise', NOW() + INTERVAL '365 days'),
  ('u-user',  348,  'pro',        NOW() + INTERVAL '18 days'),
  ('u-demo',  100,  'basic',      NOW() + INTERVAL '30 days')
ON CONFLICT (user_id) DO NOTHING;
