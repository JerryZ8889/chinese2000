'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { speakCamela } from '@/lib/speech/tts'
import { useStore } from '@/store/useStore'
import { getUserProgress } from '@/lib/supabase/progress'
import stories from '@/data/camela-stories.json'
import camelaData from '@/data/camela.json'

const isChinese = (char: string) => /[\u4e00-\u9fff]/.test(char)
const CAMELA_DB_OFFSET = 10

export default function BookReaderPage() {
  const router = useRouter()
  const params = useParams()
  const bookId = parseInt(params.bookId as string)
  const book = stories.find(b => b.id === bookId)
  const { user } = useStore()

  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(0)
  const [speakingChar, setSpeakingChar] = useState<string | null>(null)
  const [masteredChars, setMasteredChars] = useState<Set<string>>(new Set())
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // All 2080 quiz chars
  const quizCharSet = useMemo(() =>
    new Set(camelaData.stages.flatMap(s => s.units.flatMap(u => u.chars)))
  , [])

  useEffect(() => {
    if (!user?.id) return
    getUserProgress(user.id).then(progress => {
      const completed = progress.filter(p => p.completed && p.stage >= 11 && p.stage <= 17)
      const mastered = new Set<string>()
      completed.forEach(p => {
        const cs = p.stage - CAMELA_DB_OFFSET
        const sd = camelaData.stages.find(s => s.stage === cs)
        sd?.units.find(u => u.unit === p.unit)?.chars.forEach(c => mastered.add(c))
      })
      setMasteredChars(mastered)
    }).catch(() => {})
  }, [user?.id])

  const handleCharTap = useCallback(async (char: string) => {
    if (!isChinese(char)) return
    setSpeakingChar(char)
    try { await speakCamela(char) } catch { /* ignore */ }
    finally { setSpeakingChar(null) }
  }, [])

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">找不到这本书</p>
      </div>
    )
  }

  const totalPages = book.pages.length
  const page = book.pages[currentPage]

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setDirection(1)
      setCurrentPage(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (currentPage > 0) {
      setDirection(-1)
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (diff > 60) goNext()      // swipe left → next
    else if (diff < -60) goPrev() // swipe right → prev
    setTouchStart(null)
  }

  // Wrap text so each Chinese char is tappable; unmastered chars get underline dot
  const renderTappableText = (text: string, className: string) => {
    return (
      <span className={className}>
        {Array.from(text).map((char, i) => {
          if (!isChinese(char)) return <span key={i}>{char}</span>
          const isInQuiz = quizCharSet.has(char)
          const isMastered = masteredChars.has(char)
          const showDot = isInQuiz && !isMastered
          return (
            <span
              key={i}
              onClick={() => handleCharTap(char)}
              className={`cursor-pointer hover:bg-violet-100 rounded transition-colors inline-block ${
                speakingChar === char ? 'bg-violet-200' : ''
              } ${showDot ? 'border-b-2 border-dotted border-violet-300' : ''}`}
            >
              {char}
            </span>
          )
        })}
      </span>
    )
  }

  // Parse content: highlight dialogue and action
  const renderContent = (text: string) => {
    const parts: { type: 'narration' | 'dialogue' | 'action'; text: string }[] = []
    let remaining = text

    while (remaining.length > 0) {
      // Find next dialogue or action
      const dialogueIdx = remaining.indexOf('\u201c')
      const actionIdx = remaining.indexOf('\u3010')

      if (dialogueIdx === -1 && actionIdx === -1) {
        parts.push({ type: 'narration', text: remaining })
        break
      }

      const nextIdx = dialogueIdx === -1 ? actionIdx : actionIdx === -1 ? dialogueIdx : Math.min(dialogueIdx, actionIdx)

      // Add narration before
      if (nextIdx > 0) {
        parts.push({ type: 'narration', text: remaining.substring(0, nextIdx) })
      }

      if (remaining[nextIdx] === '\u201c') {
        // Dialogue: find closing \u201d
        const closeIdx = remaining.indexOf('\u201d', nextIdx)
        if (closeIdx !== -1) {
          parts.push({ type: 'dialogue', text: remaining.substring(nextIdx, closeIdx + 1) })
          remaining = remaining.substring(closeIdx + 1)
        } else {
          parts.push({ type: 'dialogue', text: remaining.substring(nextIdx) })
          remaining = ''
        }
      } else {
        // Action: find closing \u3011
        const closeIdx = remaining.indexOf('\u3011', nextIdx)
        if (closeIdx !== -1) {
          parts.push({ type: 'action', text: remaining.substring(nextIdx, closeIdx + 1) })
          remaining = remaining.substring(closeIdx + 1)
        } else {
          parts.push({ type: 'action', text: remaining.substring(nextIdx) })
          remaining = ''
        }
      }

      continue
    }

    return (
      <div className="space-y-3">
        {parts.map((part, i) => {
          if (part.type === 'dialogue') {
            return (
              <p key={i} className="text-lg leading-relaxed">
                {renderTappableText(part.text, 'text-violet-700 font-medium')}
              </p>
            )
          }
          if (part.type === 'action') {
            return (
              <p key={i} className="text-sm leading-relaxed">
                {renderTappableText(part.text, 'text-amber-600 italic')}
              </p>
            )
          }
          // Narration - split by double newline for paragraphs
          return part.text.split('\n\n').filter(s => s.trim()).map((para, j) => (
            <p key={`${i}-${j}`} className="text-lg leading-relaxed">
              {renderTappableText(para.trim(), 'text-gray-700')}
            </p>
          ))
        })}
      </div>
    )
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <main className="h-[100dvh] flex flex-col bg-amber-50/30 overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm border-b border-gray-100"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/camela/stories')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate text-sm">{book.subtitle}</p>
          <p className="text-xs text-gray-400">第 {page.page} 页 / 共 {totalPages} 页</p>
        </div>
      </motion.header>

      {/* Page content */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.25 }}
            className="absolute inset-0 p-4 pb-2 overflow-y-auto"
          >
            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                {/* Page number badge */}
                <div className="flex justify-center mb-5">
                  <span className="px-3 py-1 bg-violet-100 text-violet-600 text-xs font-bold rounded-full">
                    第 {page.page} 页
                  </span>
                </div>
                {renderContent(page.content)}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation — fixed at bottom of flex layout */}
      <div className="flex-shrink-0 px-4 py-3 bg-white/90 backdrop-blur-sm border-t border-gray-100 safe-area-bottom">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            disabled={currentPage === 0}
            className={`p-3 rounded-xl ${currentPage === 0 ? 'text-gray-300' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>

          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {totalPages <= 20 ? (
              book.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > currentPage ? 1 : -1); setCurrentPage(i) }}
                  className={`rounded-full transition-all ${
                    i === currentPage
                      ? 'w-6 h-2 bg-violet-500'
                      : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))
            ) : (
              <span className="text-sm text-gray-500 font-medium">
                {currentPage + 1} / {totalPages}
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            disabled={currentPage === totalPages - 1}
            className={`p-3 rounded-xl ${currentPage === totalPages - 1 ? 'text-gray-300' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </main>
  )
}
