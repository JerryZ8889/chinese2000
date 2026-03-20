'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getUserProgress } from '@/lib/supabase/progress'
import stories from '@/data/camela-stories.json'
import camelaData from '@/data/camela.json'
import bookCharsData from '@/data/camela-book-chars.json'

const BOOK_EMOJIS = ['🌊', '⭐', '🐣', '☀️', '🐱', '👾', '🔍', '🦊', '💕', '🐑', '💪', '🍳']
const CAMELA_DB_OFFSET = 10

export default function StoriesPage() {
  const router = useRouter()
  const { user } = useStore()
  const [masteredChars, setMasteredChars] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => { setIsHydrated(true) }, [])

  const loadMastery = useCallback(async () => {
    if (!user?.id) return
    try {
      const allProgress = await getUserProgress(user.id)
      const completed = allProgress.filter(p => p.completed && p.stage >= 11 && p.stage <= 17)
      const mastered = new Set<string>()
      completed.forEach(p => {
        const camelaStage = p.stage - CAMELA_DB_OFFSET
        const stageData = camelaData.stages.find(s => s.stage === camelaStage)
        const unitData = stageData?.units.find(u => u.unit === p.unit)
        unitData?.chars.forEach(c => mastered.add(c))
      })
      setMasteredChars(mastered)
    } catch (e) { console.error(e) }
  }, [user?.id])

  useEffect(() => {
    if (!isHydrated || !user) return
    loadMastery()
  }, [isHydrated, user, loadMastery])

  const bookMastery = useMemo(() => {
    return bookCharsData.map(book => {
      const total = book.chars.length
      const mastered = book.chars.filter(c => masteredChars.has(c)).length
      return { id: book.id, total, mastered, pct: total > 0 ? Math.round((mastered / total) * 100) : 0 }
    })
  }, [masteredChars])

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
          onClick={() => router.push('/camela')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">🐥 故事阅读</h1>
          <p className="text-sm text-gray-500">不一样的卡梅拉 · 12 本绘本</p>
        </div>
      </motion.header>

      <div className="space-y-3 mb-6">
        {stories.map((book, index) => {
          const m = bookMastery.find(b => b.id === book.id)
          return (
            <motion.button
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.04 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/camela/stories/${book.id}`)}
              className="w-full p-4 bg-white rounded-2xl shadow-sm text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
                {BOOK_EMOJIS[index] || '📖'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">第 {book.id} 册：{book.subtitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-400">{book.pages.length} 页</p>
                  {m && m.pct > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400"
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${m.pct === 100 ? 'text-functional-success' : 'text-violet-500'}`}>
                          {m.pct}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <BookOpen className="w-5 h-5 text-violet-400 flex-shrink-0" />
            </motion.button>
          )
        })}
      </div>

      {/* 角色介绍入口 */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push('/camela/stories/characters')}
        className="w-full p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl text-left flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
          🎭
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800">角色大集合</p>
          <p className="text-xs text-gray-500">12 本绘本中的所有角色</p>
        </div>
        <Users className="w-5 h-5 text-amber-500 flex-shrink-0" />
      </motion.button>
    </main>
  )
}
