'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, BookOpen, Flame, Calendar, Trophy, Play } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getStudyStats, getRecentStudyDates } from '@/lib/supabase/study-records'
import { getUserBadges, UserBadge } from '@/lib/supabase/badges'
import { getUserWrongChars } from '@/lib/supabase/wrong-chars'
import { getUserProgress } from '@/lib/supabase/progress'
import { getBadgeById } from '@/data/badges'
import { unlockAudio } from '@/lib/utils/audio-unlock'
import { STAGES, UnitProgress } from '@/types'
import camelaData from '@/data/camela.json'

const CAMELA_DB_OFFSET = 10

interface ContinueTarget {
  label: string
  sublabel: string
  href: string
  gradient: string
}

function computeContinue(allProgress: UnitProgress[]): ContinueTarget | null {
  // Find latest incomplete or next unit to do
  // Check basic stages 1-4
  const basicCompleted = allProgress.filter(p => p.completed && p.stage >= 1 && p.stage <= 4)
  const basicInProgress = allProgress.find(p => !p.completed && p.current_index > 0 && p.stage >= 1 && p.stage <= 4)

  // Check camela stages 11-17
  const camelaCompleted = allProgress.filter(p => p.completed && p.stage >= 11 && p.stage <= 17)
  const camelaInProgress = allProgress.find(p => !p.completed && p.current_index > 0 && p.stage >= 11 && p.stage <= 17)

  // Prefer in-progress over next unit; prefer most recent
  if (camelaInProgress) {
    const cs = camelaInProgress.stage - CAMELA_DB_OFFSET
    return {
      label: `卡梅拉 阶段${cs} 单元${camelaInProgress.unit}`,
      sublabel: `已做到第 ${camelaInProgress.current_index} 题`,
      href: `/camela/quiz/${cs}/${camelaInProgress.unit}`,
      gradient: 'from-violet-500 to-indigo-500',
    }
  }

  if (basicInProgress) {
    const stageInfo = STAGES.find(s => s.stage === basicInProgress.stage)
    return {
      label: `${stageInfo?.name || '阶段' + basicInProgress.stage} 单元${basicInProgress.unit}`,
      sublabel: `已做到第 ${basicInProgress.current_index} 题`,
      href: `/quiz/${basicInProgress.stage}/${basicInProgress.unit}`,
      gradient: 'from-primary-coral to-primary-yellow',
    }
  }

  // Find next unit to do in camela
  for (const stage of camelaData.stages) {
    const dbStage = stage.stage + CAMELA_DB_OFFSET
    const doneUnits = new Set(camelaCompleted.filter(p => p.stage === dbStage).map(p => p.unit))
    for (const unit of stage.units) {
      if (!doneUnits.has(unit.unit)) {
        return {
          label: `卡梅拉 阶段${stage.stage} 单元${unit.unit}`,
          sublabel: '下一个单元',
          href: `/camela/quiz/${stage.stage}/${unit.unit}`,
          gradient: 'from-violet-500 to-indigo-500',
        }
      }
    }
  }

  // Find next unit to do in basic
  for (const stage of STAGES) {
    const doneUnits = new Set(basicCompleted.filter(p => p.stage === stage.stage).map(p => p.unit))
    for (let u = 1; u <= stage.totalUnits; u++) {
      if (!doneUnits.has(u)) {
        return {
          label: `${stage.name} 单元${u}`,
          sublabel: '下一个单元',
          href: `/quiz/${stage.stage}/${u}`,
          gradient: 'from-primary-coral to-primary-yellow',
        }
      }
    }
  }

  return null
}

export default function HomePage() {
  const router = useRouter()
  const { user, logout } = useStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [studyStats, setStudyStats] = useState({ streak: 0, totalDays: 0, totalUnits: 0 })
  const [recentBadges, setRecentBadges] = useState<UserBadge[]>([])
  const [wrongCount, setWrongCount] = useState(0)
  const [continueTarget, setContinueTarget] = useState<ContinueTarget | null>(null)
  const [studyDates, setStudyDates] = useState<Set<string>>(new Set())

  useEffect(() => { setIsHydrated(true) }, [])

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [stats, badges, wrongChars, allProgress, dates] = await Promise.all([
        getStudyStats(user.id),
        getUserBadges(user.id),
        getUserWrongChars(user.id),
        getUserProgress(user.id),
        getRecentStudyDates(user.id, 7),
      ])
      setStudyStats(stats)
      setRecentBadges(badges.slice(0, 5))
      setWrongCount(wrongChars.length)
      setContinueTarget(computeContinue(allProgress))
      setStudyDates(dates)
    } catch (e) {
      console.error(e)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isHydrated) return
    const timer = setTimeout(() => {
      if (!user) { router.push('/'); return }
      loadData()
    }, 100)
    return () => clearTimeout(timer)
  }, [isHydrated, user, router, loadData])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 flex flex-col">
      {/* 头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">
              你好，{user.username}！
            </h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/achievements')}
              className="flex items-center gap-0.5"
              title="我的徽章"
            >
              {recentBadges.length > 0 ? (
                recentBadges.slice(0, 3).map(b => (
                  <span key={b.badge_id} className="text-xl leading-none">
                    {getBadgeById(b.badge_id)?.emoji}
                  </span>
                ))
              ) : (
                <span className="text-xl leading-none opacity-30">🏆</span>
              )}
            </motion.button>
          </div>
          <p className="text-gray-500 text-sm">选择今天的学习内容</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
        </motion.button>
      </motion.header>

      {/* 学习统计 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-primary-coral to-primary-yellow rounded-2xl p-4 mb-4 text-white"
      >
        <div className="flex justify-around text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Flame className="w-5 h-5" />
              <span className="text-2xl font-bold">{studyStats.streak}</span>
            </div>
            <span className="text-sm opacity-90">连续学习</span>
          </div>
          <div className="w-px bg-white/30" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-5 h-5" />
              <span className="text-2xl font-bold">{studyStats.totalDays}</span>
            </div>
            <span className="text-sm opacity-90">学习天数</span>
          </div>
          <div className="w-px bg-white/30" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="w-5 h-5" />
              <span className="text-2xl font-bold">{studyStats.totalUnits}</span>
            </div>
            <span className="text-sm opacity-90">完成单元</span>
          </div>
        </div>
      </motion.div>

      {/* 本周学习日历 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
      >
        <p className="text-xs text-gray-400 mb-3">本周打卡</p>
        <div className="flex justify-between">
          {(() => {
            const today = new Date()
            const dayOfWeek = today.getDay() // 0=Sun
            // Start from Monday
            const monday = new Date(today)
            monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
            const days = ['一', '二', '三', '四', '五', '六', '日']
            return days.map((label, i) => {
              const d = new Date(monday)
              d.setDate(monday.getDate() + i)
              const dateStr = d.toISOString().split('T')[0]
              const studied = studyDates.has(dateStr)
              const isToday = dateStr === today.toISOString().split('T')[0]
              const isFuture = d > today
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className={`text-xs ${isToday ? 'font-bold text-gray-800' : 'text-gray-400'}`}>{label}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    studied
                      ? 'bg-gradient-to-br from-primary-coral to-primary-yellow text-white shadow-sm'
                      : isToday
                      ? 'border-2 border-primary-coral bg-primary-coral/5'
                      : isFuture
                      ? 'bg-gray-50'
                      : 'bg-gray-100'
                  }`}>
                    {studied ? (
                      <span className="text-sm">&#10003;</span>
                    ) : isToday ? (
                      <span className="w-2 h-2 rounded-full bg-primary-coral" />
                    ) : null}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      </motion.div>

      {/* 继续学习 */}
      {continueTarget && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { unlockAudio(); router.push(continueTarget.href) }}
          className={`w-full p-4 mb-4 bg-gradient-to-r ${continueTarget.gradient} rounded-2xl shadow-sm flex items-center gap-3 text-white`}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Play className="w-5 h-5" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold">继续学习</p>
            <p className="text-xs opacity-80">{continueTarget.label} · {continueTarget.sublabel}</p>
          </div>
        </motion.button>
      )}

      {/* 两个学习路径 */}
      <div className="flex flex-col gap-4 mb-4">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/stages')}
          className="w-full p-6 bg-gradient-to-br from-primary-coral to-primary-yellow rounded-3xl shadow-lg text-left text-white"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">📚</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">基础练习</h2>
              <p className="text-white/80 text-sm">2000 个高频汉字 · 4 个阶段</p>
              <p className="text-white/60 text-xs mt-1">系统学习日常高频字、阅读拓展、表达深化</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/camela')}
          className="w-full p-6 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-3xl shadow-lg text-left text-white"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">🐥</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">不一样的卡梅拉</h2>
              <p className="text-white/80 text-sm">2080 个绘本汉字 · 7 个阶段</p>
              <p className="text-white/60 text-xs mt-1">来自 12 本经典绘本的趣味听音识字</p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* 错题本入口 */}
      {wrongCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/wrong-book')}
          className="w-full p-4 bg-white rounded-2xl shadow-sm flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-gray-800">错题本</p>
            <span className="text-xs text-red-500">{wrongCount} 个待复习</span>
          </div>
        </motion.button>
      )}
    </main>
  )
}
