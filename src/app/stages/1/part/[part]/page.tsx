'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import UnitGrid from '@/components/stages/UnitGrid'
import { useStore } from '@/store/useStore'
import { STAGES } from '@/types'
import { getUserProgress } from '@/lib/supabase/progress'

export default function Stage1PartPage() {
  const router = useRouter()
  const params = useParams()
  const part = parseInt(params.part as string)
  const { user } = useStore()

  const [completedUnits, setCompletedUnits] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  const stageInfo = STAGES.find(s => s.stage === 1)
  const partInfo = stageInfo?.parts?.find(p => p.part === part)

  // 等待 Zustand hydrate 完成
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const loadProgress = useCallback(async () => {
    if (!user?.id) return

    try {
      const data = await getUserProgress(user.id)
      const completed: number[] = []
      let maxUnit = 0

      data
        .filter(p => p.stage === 1)
        .forEach(p => {
          if (p.completed) {
            completed.push(p.unit)
          }
          if (p.unit > maxUnit) {
            maxUnit = p.unit
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

      if (!partInfo) {
        router.push('/stages/1')
        return
      }

      loadProgress()
    }, 100)

    return () => clearTimeout(timer)
  }, [isHydrated, user, part, partInfo, router, loadProgress])

  const showContent = isHydrated && user && stageInfo && partInfo

  const handleUnitClick = (unit: number) => {
    // 将部分内的单元号转换为全局单元号
    const globalUnit = partInfo!.startUnit + unit - 1
    router.push(`/quiz/1/${globalUnit}`)
  }

  // 获取当前部分内的已完成单元（转换为局部单元号）
  const getPartCompletedUnits = (): number[] => {
    if (!partInfo) return []
    return completedUnits
      .filter(u => u >= partInfo.startUnit && u <= partInfo.endUnit)
      .map(u => u - partInfo.startUnit + 1)
  }

  // 获取当前部分内下一个可做的单元（局部单元号）
  const getPartCurrentUnit = (): number => {
    if (!partInfo) return 1
    const partCompleted = getPartCompletedUnits()
    if (partCompleted.length === 0) return 1
    return Math.min(Math.max(...partCompleted) + 1, partInfo.totalUnits)
  }

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  const partCompletedUnits = getPartCompletedUnits()
  const partCurrentUnit = getPartCurrentUnit()

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
          onClick={() => router.push('/stages/1')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </motion.button>

        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">
            {partInfo.name}
          </h1>
          <p className="text-sm text-gray-500">
            单元 {partInfo.startUnit} - {partInfo.endUnit} · 已完成 {partCompletedUnits.length} / {partInfo.totalUnits} 单元
          </p>
        </div>
      </motion.header>

      {/* 进度条 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <div className="progress-bar h-2">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(partCompletedUnits.length / partInfo.totalUnits) * 100}%` }}
          />
        </div>
      </motion.div>

      {/* 单元网格 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <UnitGrid
          totalUnits={partInfo.totalUnits}
          completedUnits={completedUnits}
          currentUnit={partCurrentUnit}
          startUnit={partInfo.startUnit}
          onUnitClick={handleUnitClick}
        />
      </motion.div>

      {/* 图例 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex justify-center gap-6 text-sm text-gray-500"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-functional-success to-teal-400" />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-coral to-primary-yellow" />
          <span>可学习</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-100" />
          <span>未解锁</span>
        </div>
      </motion.div>
    </main>
  )
}
