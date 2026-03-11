'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import QuizCard from '@/components/quiz/QuizCard'
import { useStore } from '@/store/useStore'
import { STAGES, StageData, getPartByUnit } from '@/types'
import { getUnitProgress, saveUnitProgress, updateUnitProgress } from '@/lib/supabase/progress'
import { recordWrongChar } from '@/lib/supabase/wrong-chars'
import { recordStudy } from '@/lib/supabase/study-records'
import stage1Data from '@/data/stage1.json'
import stage2Data from '@/data/stage2.json'
import stage3Data from '@/data/stage3.json'
import stage4Data from '@/data/stage4.json'

const stageDataMap: Record<number, StageData> = {
  1: stage1Data,
  2: stage2Data,
  3: stage3Data,
  4: stage4Data,
}

export default function QuizPage() {
  const router = useRouter()
  const params = useParams()
  const stage = parseInt(params.stage as string)
  const unit = parseInt(params.unit as string)
  const { user } = useStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongChars, setWrongChars] = useState<string[]>([])
  const [unitChars, setUnitChars] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [savedProgress, setSavedProgress] = useState<{currentIndex: number, score: number, wrongChars: string[]} | null>(null)

  const stageInfo = STAGES.find(s => s.stage === stage)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const timer = setTimeout(() => {
      if (!user) {
        router.push('/')
        return
      }
      loadUnitChars()
    }, 100)

    return () => clearTimeout(timer)
  }, [isHydrated, user, stage, unit, router])

  const loadUnitChars = async () => {
    const data = stageDataMap[stage]
    if (data) {
      const unitData = data.units.find(u => u.unit === unit)
      if (unitData && unitData.chars.length > 0) {
        setUnitChars(unitData.chars)
        
        // 检查是否有未完成的进度
        if (user?.id) {
          const { data: progress } = await getUnitProgress(user.id, stage, unit)
          if (progress && !progress.completed && progress.current_index > 0) {
            setSavedProgress({
              currentIndex: progress.current_index,
              score: progress.score || 0,
              wrongChars: progress.wrong_chars || []
            })
            setShowResumeDialog(true)
          }
        }
      }
    }
    setIsLoading(false)
  }

  // 保存当前进度
  const saveCurrentProgress = useCallback(async () => {
    if (!user?.id) return

    try {
      await saveUnitProgress({
        user_id: user.id,
        stage,
        unit,
        current_index: currentIndex,
        score: score,
        total: unitChars.length,
        wrong_chars: wrongChars,
        completed: false,
        completed_at: null
      })
    } catch (error) {
      console.error('保存进度失败:', error)
    }
  }, [user?.id, stage, unit, currentIndex, score, wrongChars, unitChars.length])

  // 每次答题后保存进度（有任何进展时才保存，避免初始加载时写入空记录）
  useEffect(() => {
    if (!isLoading && user?.id && (currentIndex > 0 || score > 0 || wrongChars.length > 0)) {
      const timer = setTimeout(() => {
        saveCurrentProgress()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, score, wrongChars, isLoading, user?.id, saveCurrentProgress])

  // 恢复进度
  const handleResume = () => {
    if (savedProgress) {
      setCurrentIndex(savedProgress.currentIndex)
      setScore(savedProgress.score)
      setWrongChars(savedProgress.wrongChars)
    }
    setShowResumeDialog(false)
  }

  // 从头开始
  const handleStartOver = async () => {
    if (user?.id) {
      try {
        await updateUnitProgress(user.id, stage, unit, {
          current_index: 0,
          score: 0,
          wrong_chars: [],
          completed: false
        })
      } catch (error) {
        console.error('重置进度失败:', error)
      }
    }
    setCurrentIndex(0)
    setScore(0)
    setWrongChars([])
    setShowResumeDialog(false)
  }

  const handleCorrect = useCallback(() => {
    setScore(prev => prev + 1)
  }, [])

  const handleWrong = useCallback(async () => {
    const wrongChar = unitChars[currentIndex]
    setWrongChars(prev => [...prev, wrongChar])

    if (user?.id) {
      try {
        await recordWrongChar(user.id, wrongChar, stage, unit)
      } catch (error) {
        console.error('记录错字失败:', error)
      }
    }
  }, [currentIndex, unitChars, user?.id, stage, unit])

  const handleComplete = useCallback(async () => {
    if (user?.id) {
      try {
        await saveUnitProgress({
          user_id: user.id,
          stage,
          unit,
          current_index: unitChars.length,
          completed: true,
          score,
          total: unitChars.length,
          wrong_chars: wrongChars,
          completed_at: new Date().toISOString()
        })
        
        // 记录今日学习（用于统计连续天数）
        await recordStudy(user.id)
      } catch (error) {
        console.error('保存进度失败:', error)
      }
    }

    router.push(`/report/${stage}/${unit}`)
  }, [user?.id, stage, unit, unitChars.length, score, wrongChars, router])

  const handleNext = useCallback(() => {
    if (currentIndex < unitChars.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentIndex, unitChars.length, handleComplete])

  const handleBack = () => {
    if (stage === 1) {
      const part = getPartByUnit(unit)
      router.push(`/stages/1/part/${part}`)
    } else {
      router.push(`/stages/${stage}`)
    }
  }

  const getTitle = () => {
    if (stage === 1) {
      const part = getPartByUnit(unit)
      return `基础识字 (${part}) - 单元 ${unit}`
    }
    return `第${stage}阶段 - 单元 ${unit}`
  }

  if (!stageInfo || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  if (unitChars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">暂无字表数据</div>
      </div>
    )
  }

  if (showResumeDialog) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center"
        >
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">发现未完成的练习</h2>
          <p className="text-gray-500 mb-6">
            上次练习到第 {savedProgress?.currentIndex} 题，得分 {savedProgress?.score} 分
          </p>
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartOver}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl"
            >
              重新开始
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResume}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-coral to-primary-yellow text-white font-bold rounded-2xl"
            >
              继续练习
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBack}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </motion.button>
        
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">
            {getTitle()}
          </h1>
        </div>
      </motion.header>

      <div className="flex-1 flex items-center justify-center">
        <QuizCard
          targetChar={unitChars[currentIndex]}
          allChars={unitChars}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onNext={handleNext}
          currentIndex={currentIndex}
          total={unitChars.length}
        />
      </div>
    </main>
  )
}
