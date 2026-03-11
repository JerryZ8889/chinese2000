# 汉字小达人 - 中文识字测试 Web 应用

一个面向儿童的中文识字测试 Web 应用，通过游戏化的方式帮助孩子巩固识字能力。

## 功能特性

- **多阶段学习**：4个学习阶段，从基础识字到综合提升
- **单元练习**：每单元20个汉字，听音选字的趣味练习方式
- **语音合成**：使用 Web Speech API 实现汉字发音
- **即时反馈**：选择后立即显示正确/错误反馈（含音效和撒花动画）
- **断点续练**：中途退出后可恢复上次进度
- **进度追踪**：记录每个单元的学习进度和得分
- **错题本**：自动记录错字，支持针对性复习
- **学习统计**：连续学习天数、总学习天数统计
- **管理后台**：简单的用户管理，设置有效期

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **开发语言**：TypeScript
- **样式方案**：Tailwind CSS
- **动画库**：Framer Motion
- **数据库**：Supabase (PostgreSQL)
- **状态管理**：Zustand
- **语音合成**：Web Speech API
- **部署平台**：Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/literacy-test.git
cd literacy-test
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，并填入你的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
```

### 4. 初始化数据库

在 Supabase SQL Editor 中执行以下脚本：

```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 单元进度表
CREATE TABLE IF NOT EXISTS unit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stage INT NOT NULL,
  unit INT NOT NULL,
  current_index INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  score INT DEFAULT 0,
  total INT DEFAULT 20,
  wrong_chars TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, stage, unit)
);

-- 错字记录表
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

-- 学习记录表（用于统计连续学习天数）
CREATE TABLE IF NOT EXISTS study_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  units_completed INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, study_date)
);
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
literacy-test/
├── src/
│   ├── app/                  # Next.js App Router 页面
│   │   ├── page.tsx          # 登录页
│   │   ├── stages/           # 阶段选择
│   │   ├── quiz/             # 练习页面
│   │   ├── report/           # 单元报告
│   │   ├── wrong-book/       # 错题本
│   │   ├── wrong-quiz/       # 错题练习
│   │   └── admin/            # 管理后台
│   ├── components/           # React 组件
│   ├── lib/                  # 工具函数
│   │   ├── supabase/         # 数据库操作
│   │   ├── speech/           # 语音合成
│   │   └── utils/            # 工具函数
│   ├── data/                 # 字表 JSON 数据
│   ├── store/                # Zustand 状态管理
│   └── types/                # TypeScript 类型定义
├── supabase/
│   └── migrations/           # 数据库迁移脚本
└── public/                   # 静态资源
```

## 使用说明

### 学生端

1. 在登录页输入用户名（由家长/老师创建）
2. 选择要学习的阶段
3. 选择一个单元开始练习
4. 点击发音按钮听汉字发音
5. 选择正确的汉字
6. 完成单元后查看报告

7. 可在错题本中复习错字

### 管理端

1. 访问 `/admin` 进入管理后台
2. 输入管理密码（默认：admin123）
3. 添加/编辑用户，设置有效期
4. 过期用户将无法登录使用

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署完成

## 许可证

MIT License
