'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getUnitProgress, saveUnitProgress, updateUnitProgress } from '@/lib/supabase/progress'
import { recordWrongChar } from '@/lib/supabase/wrong-chars'
import { recordStudy } from '@/lib/supabase/study-records'
import QuizCard from '@/components/quiz/QuizCard'
import camelaData from '@/data/camela.json'
import { shuffleArray } from '@/lib/utils/shuffle'

const CAMELA_DB_OFFSET = 10

export default function CamelaQuizPage() {
  const router = useRouter()
  const params = useParams()
  const stage = parseInt(params.stage as string)
  const unit = parseInt(params.unit as string)
  const dbStage = stage + CAMELA_DB_OFFSET
  const { user } = useStore()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongChars, setWrongChars] = useState<string[]>([])
  const isCompletingRef = useRef(false)
  const [unitChars, setUnitChars] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [savedProgress, setSavedProgress] = useState<{
    currentIndex: number; score: number; wrongChars: string[]
  } | null>(null)

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (!isHydrated) return
    const timer = setTimeout(() => {
      if (!user) { router.push('/'); return }
      loadUnit()
    }, 100)
    return () => clearTimeout(timer)
  }, [isHydrated, user, stage, unit, router])

  const loadUnit = async () => {
    const stageData = camelaData.stages.find(s => s.stage === stage)
    const unitData = stageData?.units.find(u => u.unit === unit)
    if (!unitData) { setIsLoading(false); return }

    const chars = shuffleArray([...unitData.chars])
    setUnitChars(chars)

    if (user?.id) {
      const progress = await getUnitProgress(user.id, dbStage, unit)
      if (progress && !progress.completed && progress.current_index > 0) {
        setSavedProgress({
          currentIndex: progress.current_index,
          score: progress.score || 0,
          wrongChars: progress.wrong_chars || [],
        })
        setShowResumeDialog(true)
      }
    }
    setIsLoading(false)
  }

  const saveCurrentProgress = useCallback(async () => {
    if (!user?.id) return
    try {
      await saveUnitProgress({
        user_id: user.id, stage: dbStage, unit,
        current_index: currentIndex, score, total: unitChars.length,
        wrong_chars: wrongChars, completed: false, completed_at: null,
      })
    } catch (e) { console.error(e) }
  }, [user?.id, dbStage, unit, currentIndex, score, wrongChars, unitChars.length])

  useEffect(() => {
    if (!isLoading && user?.id && !isCompletingRef.current && (currentIndex > 0 || score > 0 || wrongChars.length > 0)) {
      const timer = setTimeout(() => {
        if (!isCompletingRef.current) saveCurrentProgress()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, score, wrongChars, isLoading, user?.id, saveCurrentProgress])

  const handleResume = () => {
    if (savedProgress) {
      setCurrentIndex(savedProgress.currentIndex)
      setScore(savedProgress.score)
      setWrongChars(savedProgress.wrongChars)
    }
    setShowResumeDialog(false)
  }

  const handleStartOver = async () => {
    if (user?.id) {
      try {
        await updateUnitProgress(user.id, dbStage, unit, {
          current_index: 0, score: 0, wrong_chars: [], completed: false,
        })
      } catch (e) { console.error(e) }
    }
    setCurrentIndex(0); setScore(0); setWrongChars([])
    setShowResumeDialog(false)
  }

  const handleCorrect = useCallback(() => { setScore(prev => prev + 1) }, [])

  const handleWrong = useCallback(async () => {
    const wrongChar = unitChars[currentIndex]
    setWrongChars(prev => [...prev, wrongChar])
    if (user?.id) {
      try { await recordWrongChar(user.id, wrongChar, dbStage, unit) } catch (e) { console.error(e) }
    }
  }, [currentIndex, unitChars, user?.id, dbStage, unit])

  const handleComplete = useCallback(async () => {
    isCompletingRef.current = true
    if (user?.id) {
      try {
        await saveUnitProgress({
          user_id: user.id, stage: dbStage, unit,
          current_index: unitChars.length, completed: true,
          score, total: unitChars.length, wrong_chars: wrongChars,
          completed_at: new Date().toISOString(),
        })
        await recordStudy(user.id)
      } catch (e) { console.error(e) }
    }
    router.push(`/camela/report/${stage}/${unit}`)
  }, [user?.id, dbStage, stage, unit, unitChars.length, score, wrongChars, router])

  const handleNext = useCallback(() => {
    if (currentIndex < unitChars.length - 1) setCurrentIndex(prev => prev + 1)
    else handleComplete()
  }, [currentIndex, unitChars.length, handleComplete])

  if (isLoading || !isHydrated) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl animate-pulse">加载中...</div></div>
  }
  if (unitChars.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl">暂无字表数据</div></div>
  }
  if (showResumeDialog) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">发现未完成的练习</h2>
          <p className="text-gray-500 mb-6">上次练习到第 {savedProgress?.currentIndex} 题，得分 {savedProgress?.score} 分</p>
          <div className="flex gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStartOver} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl">重新开始</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleResume} className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold rounded-2xl">继续练习</motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  const stageData = camelaData.stages.find(s => s.stage === stage)

  return (
    <main className="min-h-screen p-6 flex flex-col">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => router.push(`/camela/${stage}`)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">🐥 {stageData?.name} — 单元 {unit}</h1>
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
          useCamelaAudio
        />
      </div>
    </main>
  )
}
