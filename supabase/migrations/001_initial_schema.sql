-- Sophia 中文识字测试应用数据库初始化脚本
-- 创建日期: 2026-03-11

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 用户名索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- 2. 单元进度表
-- ============================================
CREATE TABLE IF NOT EXISTS unit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stage INT NOT NULL CHECK (stage BETWEEN 1 AND 4),
  unit INT NOT NULL CHECK (unit >= 1),
  current_index INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  total INT DEFAULT 20,
  wrong_chars TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, stage, unit)
);

-- 进度查询索引
CREATE INDEX IF NOT EXISTS idx_unit_progress_user ON unit_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_unit_progress_user_stage ON unit_progress(user_id, stage);

-- ============================================
-- 3. 错字记录表
-- ============================================
CREATE TABLE IF NOT EXISTS wrong_chars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  char CHAR(1) NOT NULL,
  stage INT NOT NULL,
  unit INT NOT NULL,
  wrong_count INT DEFAULT 1,
  last_wrong_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, char)
);

-- 错字查询索引
CREATE INDEX IF NOT EXISTS idx_wrong_chars_user ON wrong_chars(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_chars_user_stage_unit ON wrong_chars(user_id, stage, unit);

-- ============================================
-- 4. 管理员配置表
-- ============================================
CREATE TABLE IF NOT EXISTS admin_config (
  id INT PRIMARY KEY DEFAULT 1,
  password_hash VARCHAR(255) NOT NULL
);

-- 插入默认管理员密码 (实际项目中应该使用加密后的密码)
INSERT INTO admin_config (password_hash) VALUES ('admin') ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. 行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_chars ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- 用户表策略：允许匿名读取（用于登录验证）
CREATE POLICY "Allow anonymous read for login" ON users
  FOR SELECT USING (true);

-- 用户表策略：允许服务端插入和更新
CREATE POLICY "Allow service role all access" ON users
  FOR ALL USING (true);

-- 进度表策略：允许所有操作（通过 service_role_key）
CREATE POLICY "Allow all on unit_progress" ON unit_progress
  FOR ALL USING (true);

-- 错字表策略：允许所有操作
CREATE POLICY "Allow all on wrong_chars" ON wrong_chars
  FOR ALL USING (true);

-- 管理员配置表策略：限制访问
CREATE POLICY "Restrict admin_config access" ON admin_config
  FOR ALL USING (false);

-- ============================================
-- 6. 触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. 示例数据（可选）
-- ============================================

-- 插入测试用户
INSERT INTO users (username, expire_at, is_active) VALUES 
  ('Sophia', '2026-12-31 23:59:59+00', true),
  ('Tom', '2026-06-30 23:59:59+00', true),
  ('Lucy', '2026-01-01 00:00:00+00', true);

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '数据库初始化完成！';
  RAISE NOTICE '请记得在 Supabase 控制台中配置正确的 RLS 策略';
END $$;
