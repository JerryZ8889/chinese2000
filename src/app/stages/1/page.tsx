'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { STAGES, StagePartInfo } from '@/types'
import { getUserProgress } from '@/lib/supabase/progress'

export default function Stage1PartsPage() {
  const router = useRouter()
  const { user } = useStore()
  const [completedUnits, setCompletedUnits] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  const stageInfo = STAGES.find(s => s.stage === 1)

  // 等待 Zustand hydrate 完成
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const loadProgress = useCallback(async () => {
    if (!user?.id) return

    try {
      const data = await getUserProgress(user.id)
      const completed: number[] = []
      data
        .filter(p => p.stage === 1)
        .forEach(p => {
          if (p.completed) {
            completed.push(p.unit)
          }
        })
      setCompletedUnits(completed)
    } catch (error) {
      console.error('加载进度失败:', error)
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

      loadProgress()
    }, 100)

    return () => clearTimeout(timer)
  }, [isHydrated, user, router, loadProgress])

  const showContent = isHydrated && user && stageInfo

  const getPartProgress = (part: StagePartInfo): { completed: number; total: number } => {
    const completed = completedUnits.filter(u => u >= part.startUnit && u <= part.endUnit).length
    return { completed, total: part.totalUnits }
  }

  const handlePartClick = (part: number) => {
    router.push(`/stages/1/part/${part}`)
  }

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6">
      {/* 头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/stages')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </motion.button>

        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">
            阶段1：{stageInfo.name}
          </h1>
          <p className="text-sm text-gray-500">
            共 {stageInfo.totalChars} 字，{stageInfo.totalUnits} 单元
          </p>
        </div>
      </motion.header>

      {/* 部分选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stageInfo.parts?.map((part, index) => {
          const progress = getPartProgress(part)
          const progressPercent = (progress.completed / progress.total) * 100

          return (
            <motion.div
              key={part.part}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePartClick(part.part)}
              className="bg-white rounded-3xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            >
              {/* 部分编号 */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4"
                style={{
                  background: `linear-gradient(135deg, #FF6B6B, #FFE66D)`
                }}
              >
                {part.part}
              </div>

              {/* 部分信息 */}
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {part.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                单元 {part.startUnit} - {part.endUnit} · {part.totalChars} 字
              </p>

              {/* 进度条 */}
              <div className="space-y-2">
                <div className="progress-bar">
                  <motion.div
                    className="progress-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {progress.completed} / {progress.total} 单元
                  </span>
                  <span className="text-primary-coral font-medium">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </main>
  )
}
