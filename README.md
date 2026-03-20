# 汉字小达人 - 中文识字学习 Web 应用

一个面向儿童的中文识字学习 Web 应用，包含两条学习路径：基础练习（2000 高频汉字）和不一样的卡梅拉（2080 绘本汉字），通过听音选字、故事阅读等方式帮助孩子巩固识字能力。

## 功能特性

### 两条学习路径

- **基础练习**：2000 个高频汉字，4 个阶段（基础识字 / 阅读拓展 / 表达深化 / 综合提升），每阶段按单元推进
- **不一样的卡梅拉**：2080 个绘本汉字，来自 12 本《不一样的卡梅拉》经典绘本，7 个阶段

### 核心练习功能

- **听音选字**：每题播放汉字发音，从 4 个选项中选出正确答案
- **智能出题**：自动排除同音干扰项（pinyin-pro 声调级别比对）
- **即时反馈**：答对撒花动画 + 音效，答错高亮正确答案
- **答后展示拼音**：选择后显示目标字的拼音（如 `海 = hǎi`）
- **断点续练**：中途退出后可恢复进度
- **高质量语音**：Azure TTS 预生成 MP3（XiaoXiaoNeural），Web Speech API 降级兜底

### 故事阅读

- **12 本绘本**：完整故事内容，翻页阅读效果
- **对话高亮**：对话紫色、动作描写琥珀色斜体
- **点字发音**：点击任意汉字即可听到发音
- **生字标注**：未掌握的字显示虚线下划线
- **掌握率**：每本书显示生字掌握百分比
- **角色大集合**：汇总 12 本书中所有角色

### 学习激励

- **成就徽章**：17 个徽章（含卡梅拉专属），完成目标自动解锁
- **学习统计**：连续学习天数、总学习天数、完成单元数
- **本周打卡日历**：首页显示本周每天学习状态
- **继续学习**：首页一键跳转上次未完成的练习
- **错题本**：自动记录错字，支持针对性复习

### 管理功能

- **用户管理**：添加/编辑/删除用户，设置有效期
- **期限控制**：过期用户显示续期提示

## 技术栈

| 层级 | 技术 | 说明 |
|-----|------|------|
| 前端框架 | Next.js 14 (App Router) | React 全栈框架 |
| 语言 | TypeScript | 类型安全 |
| 样式 | Tailwind CSS | 原子化 CSS |
| 动画 | Framer Motion | 交互动画 |
| 数据库 | Supabase (PostgreSQL) | BaaS |
| 状态管理 | Zustand | 轻量级 |
| 语音 | Azure TTS + Web Speech API | 预生成 + 降级兜底 |
| 部署 | Vercel | 自动部署 |

## 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/JerryZ8889/chinese2000.git
cd chinese2000
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AZURE_TTS_KEY=your-azure-tts-key
AZURE_TTS_REGION=eastasia
```

### 3. 初始化数据库

在 Supabase SQL Editor 中执行建表脚本（见 DESIGN.md 第 3 节）。

创建 3 个 Public Storage Bucket：
- `audio` — 基础练习 2000 字音频
- `camela-audio` — 卡梅拉 2080 字音频

### 4. 生成并上传音频

```bash
# 基础练习音频
node scripts/generate-audio.mjs
node scripts/upload-audio.mjs

# 卡梅拉音频
node scripts/generate-camela-audio.mjs
node scripts/upload-camela-audio.mjs
```

### 5. 启动

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/
│   ├── page.tsx                    # 登录页
│   ├── home/                       # 首页（学习统计 + 路径选择 + 打卡日历）
│   ├── stages/                     # 基础练习：阶段选择 → 单元选择
│   ├── camela/                     # 卡梅拉：阶段选择 → 单元选择
│   │   ├── stories/                # 故事阅读（12本 + 角色汇总）
│   │   ├── [stage]/                # 卡梅拉单元选择
│   │   ├── quiz/[stage]/[unit]/    # 卡梅拉练习
│   │   └── report/[stage]/[unit]/  # 卡梅拉报告
│   ├── quiz/[stage]/[unit]/        # 基础练习
│   ├── report/[stage]/[unit]/      # 基础报告
│   ├── achievements/               # 我的徽章
│   ├── wrong-book/                 # 错题本
│   ├── wrong-quiz/[stage]/[unit]/  # 错题练习
│   └── admin/                      # 管理后台
├── components/
│   ├── quiz/                       # QuizCard, CharButton, SpeakerButton, FeedbackOverlay
│   ├── stages/                     # StageCard, UnitGrid
│   └── badges/                     # NewBadgeModal
├── lib/
│   ├── supabase/                   # DB 操作（users, progress, wrong-chars, study-records, badges）
│   ├── speech/tts.ts               # 音频播放（speak, speakCamela）
│   └── utils/                      # shuffle, sounds, badge-checker
├── data/
│   ├── stage1~4.json               # 基础练习字表
│   ├── camela.json                 # 卡梅拉字表（7阶段 × 15/14单元 × 20字）
│   ├── camela-stories.json         # 12本故事内容 + 角色信息
│   ├── camela-book-chars.json      # 每本书的字表（用于掌握率计算）
│   └── badges.ts                   # 17个徽章定义
├── store/useStore.ts               # Zustand 状态
└── types/index.ts                  # TypeScript 类型
```

## 数据库说明

### 阶段编号

| DB stage | 含义 |
|----------|------|
| 1-4 | 基础练习的 4 个阶段 |
| 11-17 | 卡梅拉的 7 个阶段（camela stage N → DB stage N+10） |

所有表（unit_progress、wrong_chars）通过 stage 字段区分两条学习路径。

## 许可证

MIT License
