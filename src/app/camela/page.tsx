'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, BookOpen } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getUserProgress } from '@/lib/supabase/progress'
import camelaData from '@/data/camela.json'

// 卡梅拉 stage N → DB stage N+10
const CAMELA_DB_OFFSET = 10

interface StageProgress {
  [key: number]: number
}

export default function CamelaPage() {
  const router = useRouter()
  const { user } = useStore()
  const [stageProgress, setStageProgress] = useState<StageProgress>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => { setIsHydrated(true) }, [])

  const loadProgress = useCallback(async () => {
    if (!user?.id) return
    try {
      const allProgress = await getUserProgress(user.id)
      const progress: StageProgress = {}
      camelaData.stages.forEach(s => { progress[s.stage] = 0 })
      allProgress.forEach(p => {
        const camelaStage = p.stage - CAMELA_DB_OFFSET
        if (p.completed && camelaStage >= 1 && camelaStage <= 7) {
          progress[camelaStage] = (progress[camelaStage] || 0) + 1
        }
      })
      setStageProgress(progress)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isHydrated) return
    const timer = setTimeout(() => {
      if (!user) { router.push('/'); return }
      loadProgress()
    }, 100)
    return () => clearTimeout(timer)
  }, [isHydrated, user, router, loadProgress])

  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 pb-10">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/home')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">🐥 不一样的卡梅拉</h1>
          <p className="text-sm text-gray-500">2080 个汉字 · 7 个阶段</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => router.push('/camela/stories')}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm font-medium rounded-xl transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          故事阅读
        </motion.button>
      </motion.header>

      {/* 阶段卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {camelaData.stages.map((stage, index) => {
          const completed = stageProgress[stage.stage] || 0
          const progress = (completed / stage.totalUnits) * 100
          const isComplete = completed === stage.totalUnits

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/camela/${stage.stage}`)}
              className="relative p-6 rounded-3xl shadow-lg cursor-pointer bg-white hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
              />

              {isComplete && (
                <div className="absolute top-4 right-4 flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <Star key={i} className="w-4 h-4 text-functional-star fill-functional-star" />
                  ))}
                </div>
              )}

              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4 bg-gradient-to-br from-violet-500 to-indigo-500">
                {stage.stage}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">{stage.name}</h3>
              <p className="text-sm text-gray-500 mb-4">
                来自卡梅拉绘本的 {stage.totalChars} 个汉字
              </p>

              <div className="space-y-2">
                <div className="progress-bar">
                  <motion.div
                    className="progress-bar-fill"
                    style={{ background: 'linear-gradient(to right, #8B5CF6, #6366F1)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{completed} / {stage.totalUnits} 单元</span>
                  <span className="text-gray-400">{stage.totalChars} 字</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </main>
  )
}
