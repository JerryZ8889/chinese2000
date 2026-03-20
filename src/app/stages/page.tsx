'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import StageCard from '@/components/stages/StageCard'
import { useStore } from '@/store/useStore'
import { STAGES } from '@/types'
import { getUserProgress } from '@/lib/supabase/progress'

interface StageProgress {
  [key: number]: number
}

export default function StagesPage() {
  const router = useRouter()
  const { user } = useStore()
  const [stageProgress, setStageProgress] = useState<StageProgress>({1: 0, 2: 0, 3: 0, 4: 0})
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => { setIsHydrated(true) }, [])

  const loadData = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return }
    try {
      const data = await getUserProgress(user.id)
      const progress: StageProgress = {1: 0, 2: 0, 3: 0, 4: 0}
      data.forEach((p) => {
        if (p.completed && p.stage >= 1 && p.stage <= 4) {
          progress[p.stage]++
        }
      })
      setStageProgress(progress)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setIsLoading(false)
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

  const handleStageClick = (stage: number) => {
    router.push(`/stages/${stage}`)
  }

  if (!isHydrated || !user) {
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
        className="flex items-center gap-4 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/home')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">📚 基础练习</h1>
          <p className="text-sm text-gray-500">2000 个高频汉字 · 4 个阶段</p>
        </div>
      </motion.header>

      {/* 阶段卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STAGES.map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <StageCard
              stage={stage}
              completed={stageProgress[stage.stage]}
              onClick={() => handleStageClick(stage.stage)}
            />
          </motion.div>
        ))}
      </div>
    </main>
  )
}
