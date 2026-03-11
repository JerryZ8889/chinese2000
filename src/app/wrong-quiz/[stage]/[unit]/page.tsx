'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import QuizCard from '@/components/quiz/QuizCard'
import { useStore } from '@/store/useStore'
import { getWrongCharsByStageUnit, deleteWrongChar } from '@/lib/supabase/wrong-chars'
import { WrongChar, STAGES, getPartByUnit, StageData } from '@/types'
import { shuffleArray } from '@/lib/utils/shuffle'
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

export default function WrongCharQuizPage() {
  const router = useRouter()
  const params = useParams()
  const stage = parseInt(params.stage as string)
  const unit = parseInt(params.unit as string)
  const { user } = useStore()

  const [wrongChars, setWrongChars] = useState<WrongChar[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctChars, setCorrectChars] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [quizKey, setQuizKey] = useState(0) // 用于强制刷新 QuizCard
  
  // 记录当前题目是否已答对（用于下一题时从列表移除）
  const [currentAnswerCorrect, setCurrentAnswerCorrect] = useState(false)

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
      loadWrongChars()
    }, 100)

    return () => clearTimeout(timer)
  }, [isHydrated, user, stage, unit, router])

  const loadWrongChars = async () => {
    if (!user?.id) return

    try {
      const { data } = await getWrongCharsByStageUnit(user.id, stage, unit)
      if (data && data.length > 0) {
        setWrongChars(data)
      }
    } catch (error) {
      console.error('加载错字失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 当前要练习的错字
  const currentWrongChar = wrongChars[currentIndex]
  
  // 剩余未练习的错字（用于生成干扰项）
  const remainingChars = useMemo(() => {
    return wrongChars
      .filter(w => w.char !== currentWrongChar?.char)
      .map(w => w.char)
  }, [wrongChars, currentWrongChar?.char])
  
  // 从同等级字表中获取所有字
  const stageAllChars = useMemo(() => {
    const data = stageDataMap[stage]
    if (!data) return []
    // 获取该阶段所有单元的所有字
    return data.units.flatMap(u => u.chars)
  }, [stage])
  
  // allChars - 如果不足4个，从同等级字表中随机补充
  const allChars = useMemo(() => {
    if (!currentWrongChar) return []
    
    const baseChars = [currentWrongChar.char, ...remainingChars]
    
    // 如果已经有4个或以上，直接返回
    if (baseChars.length >= 4) {
      return baseChars
    }
    
    // 否则从同等级字表中随机抽取补充
    const needCount = 4 - baseChars.length
    const existingSet = new Set(baseChars)
    
    // 过滤掉已存在的字，然后随机抽取
    const availableChars = stageAllChars.filter(c => !existingSet.has(c))
    const shuffled = shuffleArray(availableChars)
    const extraChars = shuffled.slice(0, needCount)
    
    return [...baseChars, ...extraChars]
  }, [currentWrongChar, remainingChars, stageAllChars])

  const handleCorrect = useCallback(() => {
    // 标记当前题目答对了（下一题时才真正移除）
    setCurrentAnswerCorrect(true)
    setCorrectChars(prev => {
      const newSet = new Set(prev)
      if (currentWrongChar) {
        newSet.add(currentWrongChar.char)
      }
      return newSet
    })
  }, [currentWrongChar])

  const handleWrong = useCallback(() => {
    // 标记当前题目答错了（下一题时移到末尾）
    setCurrentAnswerCorrect(false)
  }, [])

  const handleNext = useCallback(async () => {
    // 边界检查：确保数组不为空
    if (wrongChars.length === 0 || !wrongChars[currentIndex]) {
      setIsComplete(true)
      return
    }
    
    const currentChar = wrongChars[currentIndex]
    
    // 根据答题结果处理当前字
    if (currentAnswerCorrect && currentChar) {
      // 答对了，从数据库删除
      if (user?.id) {
        try {
          await deleteWrongChar(user.id, currentChar.char)
        } catch (error) {
          console.error('移除错字失败:', error)
        }
      }
      // 从本地列表移除
      setWrongChars(prev => {
        const newArr = [...prev]
        newArr.splice(currentIndex, 1)
        return newArr
      })
      // 索引不变，因为数组长度减1，下一个字会自动移到当前位置
      
      // 检查是否完成（答对后数组为空）
      if (wrongChars.length === 1) {
        setIsComplete(true)
      }
    } else {
      // 答错了，移到数组末尾
      setWrongChars(prev => {
        const current = prev[currentIndex]
        const newArr = [...prev]
        newArr.splice(currentIndex, 1)
        newArr.push(current)
        return newArr
      })
      // 强制刷新 QuizCard（通过更新 key）
      setQuizKey(prev => prev + 1)
    }
    
    // 重置答题状态
    setCurrentAnswerCorrect(false)
  }, [currentAnswerCorrect, currentIndex, wrongChars, user?.id])

  const handleBack = () => {
    router.push('/wrong-book')
  }

  // 获取显示标题
  const getTitle = () => {
    if (stage === 1) {
      const part = getPartByUnit(unit)
      return `错字练习 - 基础识字 (${part}) 单元${unit}`
    }
    return `错字练习 - 第${stage}阶段 单元${unit}`
  }

  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  if (wrongChars.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-xl text-gray-600 mb-4">该单元没有错字</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl"
        >
          返回错题本
        </motion.button>
      </div>
    )
  }

  if (isComplete) {
    const correctCount = correctChars.size

    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            练习完成！
          </h1>
          <p className="text-gray-500 mb-6">{getTitle()}</p>

          <div className="bg-white rounded-3xl p-8 shadow-lg mb-8 w-full max-w-sm">
            <div className="text-center">
              <p className="text-gray-500 text-sm">答对移出</p>
              <p className="text-3xl font-bold text-functional-success">
                {correctCount}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="px-8 py-3 bg-gradient-to-r from-primary-coral to-primary-yellow text-white font-bold rounded-2xl shadow-lg"
          >
            返回错题本
          </motion.button>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 flex flex-col">
      {/* 头部 */}
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
          <p className="text-sm text-gray-500">
            剩余 {wrongChars.length - currentIndex} 个错字
          </p>
        </div>
      </motion.header>

      {/* 练习区域 */}
      <div className="flex-1 flex items-center justify-center">
        {currentWrongChar && (
          <QuizCard
            key={`${currentWrongChar.char}-${currentIndex}-${quizKey}`}
            targetChar={currentWrongChar.char}
            allChars={allChars}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onNext={handleNext}
            currentIndex={currentIndex}
            total={wrongChars.length}
          />
        )}
      </div>
    </main>
  )
}
