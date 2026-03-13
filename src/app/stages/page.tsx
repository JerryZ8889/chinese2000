'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, BookOpen, Flame, Calendar, Trophy } from 'lucide-react'
import StageCard from '@/components/stages/StageCard'
import { useStore } from '@/store/useStore'
import { STAGES } from '@/types'
import { getUserProgress } from '@/lib/supabase/progress'
import { getStudyStats } from '@/lib/supabase/study-records'
import { getUserBadges, UserBadge } from '@/lib/supabase/badges'
import { getBadgeById } from '@/data/badges'

interface StageProgress {
  [key: number]: number
}

export default function StagesPage() {
  const router = useRouter()
  const { user, logout } = useStore()
  const [stageProgress, setStageProgress] = useState<StageProgress>({1: 0, 2: 0, 3: 0, 4: 0})
  const [studyStats, setStudyStats] = useState({ streak: 0, totalDays: 0, totalUnits: 0 })
  const [recentBadges, setRecentBadges] = useState<UserBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      // 并行加载进度、统计、徽章
      const [data, stats, badges] = await Promise.all([
        getUserProgress(user.id),
        getStudyStats(user.id),
        getUserBadges(user.id),
      ])

      const progress: StageProgress = {1: 0, 2: 0, 3: 0, 4: 0}
      data.forEach((p) => {
        if (p.completed && p.stage >= 1 && p.stage <= 4) {
          progress[p.stage]++
        }
      })
      setStageProgress(progress)
      setStudyStats(stats)
      setRecentBadges(badges.slice(0, 3))
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isHydrated) return

    const timer = setTimeout(() => {
      if (!user) {
        router.push('/')
        return
      }

      loadData()
    }, 100)

    return () => clearTimeout(timer)
  }, [isHydrated, user, router, loadData])

  const showContent = isHydrated && user

  const handleStageClick = (stage: number) => {
    router.push(`/stages/${stage}`)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 pb-24">
      {/* 头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">
              你好，{user?.username || '小朋友'}！
            </h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/achievements')}
              className="flex items-center gap-0.5"
              title="查看我的成就"
            >
              {recentBadges.length > 0 ? (
                recentBadges.map(b => (
                  <span key={b.badge_id} className="text-xl leading-none">
                    {getBadgeById(b.badge_id)?.emoji}
                  </span>
                ))
              ) : (
                <span className="text-xl leading-none opacity-30">🏆</span>
              )}
            </motion.button>
          </div>
          <p className="text-gray-500">今天想学习哪个阶段呢？</p>
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

      {/* 学习统计卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary-coral to-primary-yellow rounded-2xl p-4 mb-6 text-white"
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

      {/* 阶段卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {STAGES.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.05 }}
          >
            <StageCard
              stage={stage}
              completed={stageProgress[stage.stage]}
              onClick={() => handleStageClick(stage.stage)}
            />
          </motion.div>
        ))}
      </div>

      {/* 错题本入口 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/wrong-book')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-400 to-red-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl"
        >
          <BookOpen className="w-5 h-5" />
          我的错题本
        </motion.button>
      </motion.div>
    </main>
  )
}
