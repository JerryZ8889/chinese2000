import { UnitProgress, STAGES } from '@/types'

interface BadgeCheckInput {
  streak: number
  allProgress: UnitProgress[]
  wrongCharsCount: number
  earnedBadgeIds: string[]
}

export const computeNewBadges = ({
  streak,
  allProgress,
  wrongCharsCount,
  earnedBadgeIds,
}: BadgeCheckInput): string[] => {
  const completed = allProgress.filter(p => p.completed)
  const totalCompleted = completed.length

  // 各阶段完成单元数（基础练习 1-4）
  const byStage: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  completed.forEach(p => {
    if (p.stage >= 1 && p.stage <= 4) byStage[p.stage]++
  })

  // 卡梅拉各阶段完成单元数（DB stage 11-17 → camela stage 1-7）
  const camelaByStage: Record<number, number> = {}
  const camelaUnitsPerStage = [15, 15, 15, 15, 15, 15, 14] // 7 stages
  completed.forEach(p => {
    if (p.stage >= 11 && p.stage <= 17) {
      const cs = p.stage - 10
      camelaByStage[cs] = (camelaByStage[cs] || 0) + 1
    }
  })
  const camelaAllDone = camelaUnitsPerStage.every((need, i) => (camelaByStage[i + 1] || 0) >= need)

  // 最近 3 个完成的单元（按完成时间降序）
  const sortedCompleted = [...completed].sort((a, b) => {
    const ta = a.completed_at ? new Date(a.completed_at).getTime() : 0
    const tb = b.completed_at ? new Date(b.completed_at).getTime() : 0
    return tb - ta
  })
  const recent3 = sortedCompleted.slice(0, 3)
  const isPerfect3 =
    recent3.length === 3 && recent3.every(p => p.total > 0 && p.score === p.total)

  const [s1, s2, s3, s4] = STAGES.map(s => s.totalUnits) // 60, 15, 15, 10

  const conditions: Record<string, boolean> = {
    first_unit:    totalCompleted >= 1,
    streak_3:      streak >= 3,
    streak_7:      streak >= 7,
    streak_30:     streak >= 30,
    units_10:      totalCompleted >= 10,
    units_30:      totalCompleted >= 30,
    units_50:      totalCompleted >= 50,
    units_80:      totalCompleted >= 80,
    stage_1:       byStage[1] >= s1,
    stage_2:       byStage[2] >= s2,
    stage_3:       byStage[3] >= s3,
    stage_4:       byStage[4] >= s4,
    perfect_score: completed.some(p => p.total > 0 && p.score === p.total),
    perfect_3:     isPerfect3,
    zero_wrong:    wrongCharsCount === 0 && totalCompleted > 0,
    camela_1:      (camelaByStage[1] || 0) >= camelaUnitsPerStage[0],
    camela_all:    camelaAllDone,
  }

  const earnedSet = new Set(earnedBadgeIds)
  return Object.entries(conditions)
    .filter(([id, met]) => met && !earnedSet.has(id))
    .map(([id]) => id)
}
