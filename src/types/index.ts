// 用户类型
export interface User {
  id: string
  username: string
  expire_at: string | null
  created_at: string
  is_active: boolean
}

// 单元进度类型
export interface UnitProgress {
  id: string
  user_id: string
  stage: number
  unit: number
  current_index: number
  completed: boolean
  score: number
  total: number
  wrong_chars: string[]
  completed_at: string | null
}

// 错字记录类型
export interface WrongChar {
  id: string
  user_id: string
  char: string
  stage: number
  unit: number
  wrong_count: number
  last_wrong_at: string
}

// 学习记录类型（用于统计连续学习天数）
export interface StudyRecord {
  id: string
  user_id: string
  study_date: string // YYYY-MM-DD 格式
  units_completed: number // 当天完成的单元数
  created_at: string
}

// 阶段信息类型
export interface StageInfo {
  stage: number
  name: string
  totalChars: number
  totalUnits: number
  description: string
  hasParts?: boolean // 是否有子部分
  parts?: StagePartInfo[] // 子部分信息
}

// 阶段子部分类型
export interface StagePartInfo {
  part: number
  name: string
  totalChars: number
  totalUnits: number
  startUnit: number // 起始单元号
  endUnit: number // 结束单元号
}

// 单元数据类型
export interface UnitData {
  unit: number
  chars: string[]
}

// 阶段字表类型
export interface StageData {
  stage: number
  totalChars: number
  totalUnits: number
  units: UnitData[]
}

// 练习状态类型
export interface QuizState {
  currentCharIndex: number
  targetChar: string
  options: string[]
  score: number
  wrongChars: string[]
  isAnswered: boolean
  selectedChar: string | null
  isCorrect: boolean | null
}

// 全局状态类型
export interface AppState {
  user: User | null
  currentStage: number | null
  currentUnit: number | null
  setUser: (user: User | null) => void
  setCurrentStage: (stage: number | null) => void
  setCurrentUnit: (unit: number | null) => void
  logout: () => void
}

// 阶段配置
export const STAGES: StageInfo[] = [
  {
    stage: 1,
    name: '基础识字',
    totalChars: 1200,
    totalUnits: 60,
    description: '日常高频字 + Sophia兴趣领域常用字',
    hasParts: true,
    parts: [
      { part: 1, name: '核心高频', totalChars: 300, totalUnits: 15, startUnit: 1, endUnit: 15 },
      { part: 2, name: '日常认知', totalChars: 300, totalUnits: 15, startUnit: 16, endUnit: 30 },
      { part: 3, name: '学习社交', totalChars: 300, totalUnits: 15, startUnit: 31, endUnit: 45 },
      { part: 4, name: '进阶拓展', totalChars: 300, totalUnits: 15, startUnit: 46, endUnit: 60 },
    ],
  },
  {
    stage: 2,
    name: '阅读拓展',
    totalChars: 300,
    totalUnits: 15,
    description: '章节书阅读中频繁遇到的字',
  },
  {
    stage: 3,
    name: '表达深化',
    totalChars: 300,
    totalUnits: 15,
    description: '表达观点、演讲和讨论的词汇',
  },
  {
    stage: 4,
    name: '综合提升',
    totalChars: 200,
    totalUnits: 10,
    description: '抽象书面语词汇和常用成语',
  },
]

// 根据单元号获取该单元属于第几部分（仅第一阶段）
export const getPartByUnit = (unit: number): number => {
  if (unit >= 1 && unit <= 15) return 1
  if (unit >= 16 && unit <= 30) return 2
  if (unit >= 31 && unit <= 45) return 3
  if (unit >= 46 && unit <= 60) return 4
  return 1
}
