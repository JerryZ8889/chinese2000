'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, RefreshCw, ArrowLeft, Home } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getPartByUnit, STAGES } from '@/types'
import { getUnitProgress, getUserProgress } from '@/lib/supabase/progress'
import { getStudyStats } from '@/lib/supabase/study-records'
import { getUserWrongChars } from '@/lib/supabase/wrong-chars'
import { getUserBadges, awardBadges } from '@/lib/supabase/badges'
import { computeNewBadges } from '@/lib/utils/badge-checker'
import NewBadgeModal from '@/components/badges/NewBadgeModal'

export default function ReportPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useStore()
  
  const stage = parseInt(params.stage as string)
  const unit = parseInt(params.unit as string)
  
  const [isLoading, setIsLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(20)
  const [wrongChars, setWrongChars] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [newBadgeIds, setNewBadgeIds] = useState<string[]>([])
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  const starCount = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0

  // 等待 Zustand hydrate 完成
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // 从数据库加载进度数据
  useEffect(() => {
    if (!isHydrated) return

    const loadProgress = async () => {
      if (!user?.id) {
        router.push('/')
        return
      }

      try {
        // 加载本单元进度
        const data = await getUnitProgress(user.id, stage, unit)
        const currentScore = data?.score || 0
        const currentTotal = data?.total || 20
        const currentWrongChars = data?.wrong_chars || []
        setScore(currentScore)
        setTotal(currentTotal)
        setWrongChars(currentWrongChars)

        // 并行加载徽章检测所需数据
        const [allProgress, studyStats, allWrongChars, earnedBadges] = await Promise.all([
          getUserProgress(user.id),
          getStudyStats(user.id),
          getUserWrongChars(user.id),
          getUserBadges(user.id),
        ])

        // 计算本次新解锁的徽章
        const newIds = computeNewBadges({
          streak: studyStats.streak,
          allProgress,
          wrongCharsCount: allWrongChars.length,
          earnedBadgeIds: earnedBadges.map(b => b.badge_id),
        })

        if (newIds.length > 0) {
          await awardBadges(user.id, newIds)
          setNewBadgeIds(newIds)
          setShowBadgeModal(true)
        }
      } catch (error) {
        console.error('加载进度失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [isHydrated, user, stage, unit, router])

  const handleRetry = () => {
    router.push(`/quiz/${stage}/${unit}`)
  }

  const handleBackToUnits = () => {
    // 第一阶段返回到对应的子部分页面
    if (stage === 1) {
      const part = getPartByUnit(unit)
      router.push(`/stages/1/part/${part}`)
    } else {
      router.push(`/stages/${stage}`)
    }
  }

  // 获取显示标题
  const getTitle = () => {
    if (stage === 1) {
      const part = getPartByUnit(unit)
      return `基础识字 (${part}) - 单元 ${unit}`
    }
    return `第${stage}阶段 - 单元 ${unit}`
  }

  const handleGoHome = () => {
    router.push('/stages')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
      {showBadgeModal && (
        <NewBadgeModal
          badgeIds={newBadgeIds}
          onClose={() => setShowBadgeModal(false)}
        />
      )}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center"
      >
        {/* 恭喜标题 */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎉 恭喜完成！ 🎉
          </h1>
          <p className="text-gray-500">
            {getTitle()}
          </p>
        </motion.div>

        {/* 星星评分 */}
        <div className="flex gap-2 mb-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
            >
              <Star
                className={`w-12 h-12 ${
                  i < starCount
                    ? 'text-functional-star fill-functional-star'
                    : 'text-gray-300'
                }`}
              />
            </motion.div>
          ))}
        </div>

        {/* 得分信息 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-8 shadow-lg mb-8 w-full max-w-sm"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">得分</p>
              <p className="text-3xl font-bold text-primary-coral">
                {score} / {total}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">正确率</p>
              <p className="text-3xl font-bold text-functional-success">
                {accuracy}%
              </p>
            </div>
          </div>

          {/* 错字列表 */}
          {wrongChars.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 pt-6 border-t border-gray-100"
            >
              <p className="text-gray-500 text-sm mb-3">需要复习的字：</p>
              <div className="flex flex-wrap gap-2">
                {wrongChars.map((char, i) => (
                  <motion.span
                    key={char}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-bold"
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 操作按钮 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col gap-3 w-full max-w-sm"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToUnits}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl"
          >
            <ArrowLeft className="w-5 h-5" />
            返回单元列表
          </motion.button>

          {wrongChars.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-coral to-primary-yellow text-white font-bold rounded-2xl"
            >
              <RefreshCw className="w-5 h-5" />
              再练一次
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 text-gray-500 font-medium"
          >
            <Home className="w-5 h-5" />
            返回首页
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  )
}
