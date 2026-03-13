'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Flame, Calendar, Trophy, BookOpen, Target } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getUserProgress } from '@/lib/supabase/progress'
import { getStudyStats } from '@/lib/supabase/study-records'
import { getUserBadges, UserBadge } from '@/lib/supabase/badges'
import { BADGES } from '@/data/badges'

export default function AchievementsPage() {
  const router = useRouter()
  const { user } = useStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ streak: 0, totalDays: 0, totalUnits: 0 })
  const [completedUnits, setCompletedUnits] = useState(0)
  const [avgAccuracy, setAvgAccuracy] = useState(0)
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([])

  useEffect(() => { setIsHydrated(true) }, [])

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [progress, studyStats, badges] = await Promise.all([
        getUserProgress(user.id),
        getStudyStats(user.id),
        getUserBadges(user.id),
      ])

      const completed = progress.filter(p => p.completed)
      setCompletedUnits(completed.length)

      const totalScore = completed.reduce((sum, p) => sum + p.score, 0)
      const totalPossible = completed.reduce((sum, p) => sum + p.total, 0)
      setAvgAccuracy(totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0)

      setStats(studyStats)
      setEarnedBadges(badges)
    } catch (error) {
      console.error('加载成就失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isHydrated) return
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [isHydrated, user, router, loadData])

  const earnedMap = new Map(earnedBadges.map(b => [b.badge_id, b]))
  const charsLearned = completedUnits * 20

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 pb-10">
      {/* 头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/stages')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <h1 className="text-2xl font-bold text-gray-800">我的成就</h1>
      </motion.header>

      {/* 学习报告 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary-coral to-primary-yellow rounded-2xl p-5 mb-6 text-white"
      >
        <h2 className="text-sm font-medium opacity-80 mb-4">学习报告</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-2xl font-bold">{stats.streak}</span>
            </div>
            <span className="text-xs opacity-90">连续天数</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-2xl font-bold">{stats.totalDays}</span>
            </div>
            <span className="text-xs opacity-90">学习天数</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-2xl font-bold">{completedUnits}</span>
            </div>
            <span className="text-xs opacity-90">完成单元</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center mt-4 pt-4 border-t border-white/20">
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-2xl font-bold">{charsLearned}</span>
            </div>
            <span className="text-xs opacity-90">已学汉字</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-2xl font-bold">{avgAccuracy}%</span>
            </div>
            <span className="text-xs opacity-90">平均正确率</span>
          </div>
        </div>
      </motion.div>

      {/* 徽章墙 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">成就徽章</h2>
          <span className="text-sm text-gray-400">
            {earnedBadges.length} / {BADGES.length} 已解锁
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((badge, index) => {
            const earned = earnedMap.get(badge.id)
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + index * 0.03 }}
                className={`flex flex-col items-center p-4 rounded-2xl text-center transition-all ${
                  earned ? 'bg-white shadow-md' : 'bg-gray-100 opacity-40'
                }`}
              >
                <span className="text-3xl mb-2">{badge.emoji}</span>
                <span className={`text-xs font-bold mb-1 leading-tight ${earned ? 'text-gray-800' : 'text-gray-500'}`}>
                  {badge.name}
                </span>
                <span className="text-xs text-gray-400 leading-tight">{badge.description}</span>
                {earned && (
                  <span className="text-xs text-primary-teal mt-1.5 font-medium">
                    {new Date(earned.earned_at).toLocaleDateString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </main>
  )
}
