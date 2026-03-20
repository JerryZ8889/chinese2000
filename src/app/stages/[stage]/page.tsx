'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import UnitGrid from '@/components/stages/UnitGrid'
import { useStore } from '@/store/useStore'
import { STAGES } from '@/types'
import { getUserProgress } from '@/lib/supabase/progress'

export default function StagePage() {
  const router = useRouter()
  const params = useParams()
  const stage = parseInt(params.stage as string)
  const { user } = useStore()
  
  const [completedUnits, setCompletedUnits] = useState<number[]>([])
  const [unitScores, setUnitScores] = useState<Map<number, { score: number; total: number }>>(new Map())
  const [currentUnit, setCurrentUnit] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  const stageInfo = STAGES.find(s => s.stage === stage)

  // 等待 Zustand hydrate 完成
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const loadProgress = useCallback(async () => {
    if (!user?.id) return

    try {
      const data = await getUserProgress(user.id)
      const completed: number[] = []
      const scores = new Map<number, { score: number; total: number }>()
      let maxUnit = 0

      data
        .filter(p => p.stage === stage)
        .forEach(p => {
          if (p.completed) {
            completed.push(p.unit)
            scores.set(p.unit, { score: p.score, total: p.total })
          }
          if (p.unit > maxUnit) {
            maxUnit = p.unit
          }
        })

      setCompletedUnits(completed)
      setUnitScores(scores)
      // 下一个可做的单元 = 已完成最大单元 + 1，至少为1
      setCurrentUnit(Math.min(maxUnit + 1, stageInfo?.totalUnits || 1))
    } catch (error) {
      console.error('加载进度失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, stage, stageInfo?.totalUnits])

  useEffect(() => {
    if (!isHydrated) return

    // 延迟检查 user，给 persist 时间恢复数据
    const timer = setTimeout(() => {
      if (!user) {
        router.push('/')
        return
      }

      if (stage < 1 || stage > 4) {
        router.push('/stages')
        return
      }

      loadProgress()
    }, 100)

    return () => clearTimeout(timer)
  }, [isHydrated, user, stage, router, loadProgress])

  const showContent = isHydrated && user && stageInfo

  const handleUnitClick = (unit: number) => {
    router.push(`/quiz/${stage}/${unit}`)
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
            阶段{stage}：{stageInfo.name}
          </h1>
          <p className="text-sm text-gray-500">
            已完成 {completedUnits.length} / {stageInfo.totalUnits} 单元
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
            animate={{ width: `${(completedUnits.length / stageInfo.totalUnits) * 100}%` }}
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
          totalUnits={stageInfo.totalUnits}
          completedUnits={completedUnits}
          unitScores={unitScores}
          currentUnit={currentUnit}
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
