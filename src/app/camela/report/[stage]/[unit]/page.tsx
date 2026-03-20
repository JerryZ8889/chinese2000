'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, RefreshCw, ArrowLeft, Home } from 'lucide-react'
import { unlockAudio } from '@/lib/utils/audio-unlock'
import { useStore } from '@/store/useStore'
import { getUnitProgress } from '@/lib/supabase/progress'
import camelaData from '@/data/camela.json'

const CAMELA_DB_OFFSET = 10

export default function CamelaReportPage() {
  const router = useRouter()
  const params = useParams()
  const stage = parseInt(params.stage as string)
  const unit = parseInt(params.unit as string)
  const dbStage = stage + CAMELA_DB_OFFSET
  const { user } = useStore()

  const [isLoading, setIsLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [wrongChars, setWrongChars] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  const starCount = accuracy >= 90 ? 3 : accuracy >= 50 ? 2 : 1

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (!isHydrated) return
    const load = async () => {
      if (!user?.id) { router.push('/'); return }
      try {
        const data = await getUnitProgress(user.id, dbStage, unit)
        setScore(data?.score || 0)
        setTotal(data?.total || 0)
        setWrongChars(data?.wrong_chars || [])
      } catch (e) { console.error(e) }
      finally { setIsLoading(false) }
    }
    load()
  }, [isHydrated, user, dbStage, unit, router])

  const stageData = camelaData.stages.find(s => s.stage === stage)

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-2xl animate-pulse">加载中...</div></div>
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center">
        <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎉 恭喜完成！ 🎉</h1>
          <p className="text-gray-500">🐥 {stageData?.name} — 单元 {unit}</p>
        </motion.div>

        <div className="flex gap-2 mb-8">
          {[...Array(3)].map((_, i) => (
            <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2 + i * 0.15 }}>
              <Star className={`w-12 h-12 ${i < starCount ? 'text-functional-star fill-functional-star' : 'text-gray-300'}`} />
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white rounded-3xl p-8 shadow-lg mb-8 w-full max-w-sm">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">得分</p>
              <p className="text-3xl font-bold text-violet-600">{score} / {total}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">正确率</p>
              <p className="text-3xl font-bold text-functional-success">{accuracy}%</p>
            </div>
          </div>
          {wrongChars.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-gray-500 text-sm mb-3">需要复习的字：</p>
              <div className="flex flex-wrap gap-2">
                {wrongChars.map((char, i) => (
                  <motion.span key={char} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.05 }} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-bold">{char}</motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="flex flex-col gap-3 w-full max-w-sm">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push(`/camela/${stage}`)} className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl">
            <ArrowLeft className="w-5 h-5" />返回单元列表
          </motion.button>
          {wrongChars.length > 0 && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { unlockAudio(); router.push(`/camela/quiz/${stage}/${unit}`) }} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-bold rounded-2xl">
              <RefreshCw className="w-5 h-5" />再练一次
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/home')} className="flex items-center justify-center gap-2 px-6 py-3 text-gray-500 font-medium">
            <Home className="w-5 h-5" />返回首页
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  )
}
