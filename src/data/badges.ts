export interface BadgeDefinition {
  id: string
  name: string
  emoji: string
  description: string
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first_unit',    name: '初出茅庐',   emoji: '🌱', description: '完成第1个单元' },
  { id: 'streak_3',      name: '学习小达人', emoji: '🔥', description: '连续学习3天' },
  { id: 'streak_7',      name: '一周不间断', emoji: '💪', description: '连续学习7天' },
  { id: 'streak_30',     name: '月度冠军',   emoji: '🏆', description: '连续学习30天' },
  { id: 'units_10',      name: '小小学者',   emoji: '⭐', description: '完成10个单元' },
  { id: 'units_30',      name: '学习达人',   emoji: '🚀', description: '完成30个单元' },
  { id: 'units_50',      name: '半壁江山',   emoji: '🌈', description: '完成50个单元' },
  { id: 'units_80',      name: '识字大王',   emoji: '👑', description: '完成80个单元' },
  { id: 'stage_1',       name: '一阶通关',   emoji: '🎓', description: '第一阶段60单元全完成' },
  { id: 'stage_2',       name: '二阶通关',   emoji: '📚', description: '第二阶段15单元全完成' },
  { id: 'stage_3',       name: '三阶通关',   emoji: '🌟', description: '第三阶段15单元全完成' },
  { id: 'stage_4',       name: '汉字小达人', emoji: '🦁', description: '第四阶段10单元全完成' },
  { id: 'perfect_score', name: '完美发挥',   emoji: '💯', description: '单元满分（20/20）' },
  { id: 'perfect_3',     name: '三连满分',   emoji: '🎯', description: '连续3个单元满分' },
  { id: 'zero_wrong',    name: '知错能改',   emoji: '🧹', description: '错字本清零' },
  { id: 'camela_1',      name: '小鸡卡梅拉', emoji: '🐥', description: '完成卡梅拉第1阶段' },
  { id: 'camela_all',    name: '绘本小达人', emoji: '📖', description: '完成卡梅拉全部7个阶段' },
]

export const getBadgeById = (id: string): BadgeDefinition | undefined =>
  BADGES.find(b => b.id === id)
