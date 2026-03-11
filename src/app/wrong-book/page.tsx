'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, ChevronRight, Volume2, Play } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getUserWrongChars } from '@/lib/supabase/wrong-chars'
import { WrongChar } from '@/types'
import { speak } from '@/lib/speech/tts'

interface GroupedWrongChars {
  [key: string]: { chars: WrongChar[], stage: number, unit: number }
}

export default function WrongBookPage() {
  const router = useRouter()
  const { user } = useStore()
  const [wrongChars, setWrongChars] = useState<WrongChar[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  // 等待 Zustand hydrate 完成
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
  }, [isHydrated, user, router])

  const loadWrongChars = async () => {
    if (!user?.id) return

    try {
      const { data } = await getUserWrongChars(user.id)
      if (data) {
        setWrongChars(data)
      }
    } catch (error) {
      console.error('加载错字失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 按阶段和单元分组，并保存 stage 和 unit 信息
  const groupedChars: GroupedWrongChars = wrongChars.reduce((acc, char) => {
    const key = `阶段${char.stage} - 单元${char.unit}`
    if (!acc[key]) {
      acc[key] = { chars: [], stage: char.stage, unit: char.unit }
    }
    acc[key].chars.push(char)
    return acc
  }, {} as GroupedWrongChars)

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const totalWrongChars = wrongChars.length

  // 点击错字发音
  const handleCharClick = useCallback(async (char: string) => {
    try {
      await speak(char)
    } catch (error) {
      console.error('发音失败:', error)
    }
  }, [])

  // 开始练习该单元的错字
  const handlePractice = (stage: number, unit: number) => {
    router.push(`/wrong-quiz/${stage}/${unit}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-6 pb-20">
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
            我的错题本
          </h1>
          <p className="text-sm text-gray-500">
            共 {totalWrongChars} 个错字
          </p>
        </div>
      </motion.header>

      {/* 错字列表 */}
      {Object.keys(groupedChars).length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 text-lg">太棒了！还没有错字</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedChars).map(([key, data], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              {/* 分组标题 */}
              <button
                onClick={() => toggleGroup(key)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedGroups.has(key) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-800">{key}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {data.chars.length} 个
                  </span>
                  {/* 练习按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePractice(data.stage, data.unit)
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-primary-coral text-white text-sm font-medium rounded-lg"
                  >
                    <Play className="w-3 h-3" />
                    练习
                  </motion.button>
                </div>
              </button>

              {/* 展开的错字 */}
              <AnimatePresence>
                {expandedGroups.has(key) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 flex flex-wrap gap-3">
                      {data.chars.map((char, i) => (
                        <motion.div
                          key={char.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleCharClick(char.char)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex flex-col items-center p-3 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition-colors"
                        >
                          <div className="relative">
                            <span className="text-3xl font-bold text-gray-800 mb-1">
                              {char.char}
                            </span>
                            <Volume2 className="absolute -right-5 top-0 w-4 h-4 text-gray-400" />
                          </div>
                          <span className="text-xs text-red-500">
                            错 {char.wrong_count} 次
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  )
}
