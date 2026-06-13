-- ============================================================
-- Schema for the Metadata-Driven App Publishing Platform
-- Database: appmeta_db  (MySQL 8.0+, utf8mb4)
-- ============================================================

CREATE DATABASE IF NOT EXISTS appmeta_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE appmeta_db;

-- ============================================================
-- 1. users  ── 用户账户
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(64)   NOT NULL,
    username      VARCHAR(64)   NOT NULL,
    display_name  VARCHAR(128)  NOT NULL,
    password_hash VARCHAR(128)  NOT NULL COMMENT 'SHA-256 hex',
    email         VARCHAR(255)  NOT NULL DEFAULT '',
    phone         VARCHAR(20)   NOT NULL DEFAULT '',
    role          ENUM('user','admin') NOT NULL DEFAULT 'user',
    avatar        VARCHAR(512)  NOT NULL DEFAULT '',
    created_at    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE INDEX uq_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户账户表';

-- ============================================================
-- 2. auth_tokens  ── 登录会话令牌
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
    token       VARCHAR(128) NOT NULL,
    user_id     VARCHAR(64)  NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    expires_at  DATETIME(6)  NOT NULL,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (token),
    INDEX idx_user_id  (user_id),
    INDEX idx_expires  (expires_at),
    CONSTRAINT fk_auth_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户登录令牌表';

-- ============================================================
-- 3. user_credits  ── 积分 & 会员状态（每用户一行）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_credits (
    user_id            VARCHAR(64)  NOT NULL,
    credits            INT          NOT NULL DEFAULT 0,
    membership_tier    VARCHAR(32)  NOT NULL DEFAULT '' COMMENT 'basic/pro/advanced/enterprise',
    membership_expiry  DATETIME(6)  NULL,
    updated_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id),
    CONSTRAINT fk_credits_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户积分与会员信息表';

-- ============================================================
-- 4. app_meta  ── AI 应用元数据
-- ============================================================
CREATE TABLE IF NOT EXISTS app_meta (
    id                VARCHAR(64)   NOT NULL,
    name              VARCHAR(255)  NOT NULL,
    description       TEXT,
    category          VARCHAR(100)  NOT NULL DEFAULT '',
    tags              JSON          COMMENT '[]string',
    author            VARCHAR(255)  NOT NULL DEFAULT '',
    status            ENUM('draft','published') NOT NULL DEFAULT 'draft',
    estimated_credits INT           NOT NULL DEFAULT 0 COMMENT '预估每次调用消耗积分',
    api_config        JSON          COMMENT 'ApiConfig',
    inputs            JSON          COMMENT '[]InputField',
    outputs           JSON          COMMENT '[]OutputField',
    layout_config     JSON          COMMENT 'PageLayout',
    run_count         INT           NOT NULL DEFAULT 0,
    like_count        INT           NOT NULL DEFAULT 0,
    view_count        INT           NOT NULL DEFAULT 0,
    created_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX idx_status   (status),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='AI 应用元数据表';

-- ============================================================
-- 5. run_record  ── 应用调用记录
-- ============================================================
CREATE TABLE IF NOT EXISTS run_record (
    id           VARCHAR(64)  NOT NULL,
    user_id      VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '发起调用的用户，空串表示匿名',
    app_id       VARCHAR(64)  NOT NULL,
    app_name     VARCHAR(255) NOT NULL DEFAULT '',
    app_category VARCHAR(100) NOT NULL DEFAULT '',
    status       ENUM('pending','running','success','failed') NOT NULL DEFAULT 'running',
    inputs_json  JSON         COMMENT '用户输入快照',
    outputs_json JSON         COMMENT '接口返回快照',
    result_text  TEXT         COMMENT '对用户展示的结果摘要',
    error_msg    TEXT,
    credits_used INT          NOT NULL DEFAULT 0 COMMENT '实际扣除积分',
    started_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    finished_at  DATETIME(6)  NULL,
    duration_ms  BIGINT       NOT NULL DEFAULT 0,
    expires_at   DATETIME(6)  NULL     COMMENT '结果过期时间（24h）',
    PRIMARY KEY (id),
    INDEX idx_user_id (user_id),
    INDEX idx_app_id  (app_id),
    CONSTRAINT fk_run_app
        FOREIGN KEY (app_id) REFERENCES app_meta (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='应用调用记录表';

-- ============================================================
-- 6. payment_records  ── 支付记录
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_records (
    id           VARCHAR(64)    NOT NULL,
    user_id      VARCHAR(64)    NOT NULL,
    order_id     VARCHAR(64)    NOT NULL COMMENT '业务订单号，全局唯一',
    type         ENUM('membership','credits') NOT NULL,
    description  VARCHAR(255)   NOT NULL DEFAULT '',
    amount       DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT '人民币元',
    status       ENUM('paid','pending','refunded') NOT NULL DEFAULT 'paid',
    credits_added INT           NOT NULL DEFAULT 0 COMMENT '充值积分时新增积分数',
    tier_id      VARCHAR(32)    NOT NULL DEFAULT '' COMMENT '会员等级 id',
    created_at   DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE INDEX uq_order_id (order_id),
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_payment_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='支付记录表';

-- ============================================================
-- 初始数据（仅首次执行时插入，生产环境请改密码）
-- ============================================================
INSERT IGNORE INTO users (id, username, display_name, password_hash, email, phone, role) VALUES
  ('u-admin', 'admin', '管理员',   SHA2('admin123', 256), 'admin@appmeta.com', '', 'admin'),
  ('u-user',  'user',  '普通用户', SHA2('user123',  256), 'user@appmeta.com',  '', 'user'),
  ('u-demo',  'demo',  'Demo 用户',SHA2('demo123',  256), 'demo@appmeta.com',  '', 'user');

INSERT IGNORE INTO user_credits (user_id, credits, membership_tier, membership_expiry) VALUES
  ('u-admin', 9999, 'enterprise', DATE_ADD(NOW(), INTERVAL 365 DAY)),
  ('u-user',   348, 'pro',        DATE_ADD(NOW(), INTERVAL  18 DAY)),
  ('u-demo',   100, 'basic',      DATE_ADD(NOW(), INTERVAL  30 DAY));
