'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import UnitGrid from '@/components/stages/UnitGrid'
import { useStore } from '@/store/useStore'
import { getUserProgress } from '@/lib/supabase/progress'
import camelaData from '@/data/camela.json'

const CAMELA_DB_OFFSET = 10

export default function CamelaStagePage() {
  const router = useRouter()
  const params = useParams()
  const stage = parseInt(params.stage as string)
  const { user } = useStore()

  const [completedUnits, setCompletedUnits] = useState<number[]>([])
  const [unitScores, setUnitScores] = useState<Map<number, { score: number; total: number }>>(new Map())
  const [currentUnit, setCurrentUnit] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  const stageData = camelaData.stages.find(s => s.stage === stage)

  useEffect(() => { setIsHydrated(true) }, [])

  const loadProgress = useCallback(async () => {
    if (!user?.id || !stageData) return
    try {
      const dbStage = stage + CAMELA_DB_OFFSET
      const data = await getUserProgress(user.id)
      const completed: number[] = []
      const scores = new Map<number, { score: number; total: number }>()
      let maxUnit = 0
      data.filter(p => p.stage === dbStage).forEach(p => {
        if (p.completed) {
          completed.push(p.unit)
          scores.set(p.unit, { score: p.score, total: p.total })
        }
        if (p.unit > maxUnit) maxUnit = p.unit
      })
      setCompletedUnits(completed)
      setUnitScores(scores)
      setCurrentUnit(Math.min(maxUnit + 1, stageData.totalUnits))
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, stage, stageData])

  useEffect(() => {
    if (!isHydrated) return
    const timer = setTimeout(() => {
      if (!user) { router.push('/'); return }
      if (!stageData) { router.push('/camela'); return }
      loadProgress()
    }, 100)
    return () => clearTimeout(timer)
  }, [isHydrated, user, stage, router, loadProgress, stageData])

  if (!isHydrated || !user || !stageData || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/camela')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">
            🐥 {stageData.name}
          </h1>
          <p className="text-sm text-gray-500">
            已完成 {completedUnits.length} / {stageData.totalUnits} 单元
          </p>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="progress-bar h-2">
          <motion.div
            className="progress-bar-fill"
            style={{ background: 'linear-gradient(to right, #8B5CF6, #6366F1)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(completedUnits.length / stageData.totalUnits) * 100}%` }}
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <UnitGrid
          totalUnits={stageData.totalUnits}
          completedUnits={completedUnits}
          unitScores={unitScores}
          currentUnit={currentUnit}
          onUnitClick={(unit) => router.push(`/camela/quiz/${stage}/${unit}`)}
        />
      </motion.div>

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
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500" />
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
