'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SpeakerButton from './SpeakerButton'
import CharButton from './CharButton'
import FeedbackOverlay from './FeedbackOverlay'
import { speak, speakCamela, preloadVoices } from '@/lib/speech/tts'
import { shuffleArray } from '@/lib/utils/shuffle'
import { playCorrectSound, playWrongSound, preloadSounds } from '@/lib/utils/sounds'
import { pinyin } from 'pinyin-pro'

const getCharPinyin = (char: string): string =>
  pinyin(char, { toneType: 'num', type: 'array' })[0] || char

const getCharPinyinWithTone = (char: string): string =>
  pinyin(char, { toneType: 'symbol', type: 'array' })[0] || char

interface QuizCardProps {
  targetChar: string
  allChars: string[]
  onCorrect: () => void
  onWrong: () => void
  onNext: () => void
  currentIndex: number
  total: number
  useCamelaAudio?: boolean
}

export default function QuizCard({
  targetChar,
  allChars,
  onCorrect,
  onWrong,
  onNext,
  currentIndex,
  total,
  useCamelaAudio = false,
}: QuizCardProps) {
  const playChar = useCamelaAudio ? speakCamela : speak
  const [options, setOptions] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnswered, setIsAnswered] = useState(false)
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  // 当 targetChar 变化时，重新生成选项并自动播放
  useEffect(() => {
    preloadVoices()
    preloadSounds()

    // 生成干扰项：排除与目标字同音、以及互相同音的选项
    const targetPinyin = getCharPinyin(targetChar)
    const usedPinyins = new Set([targetPinyin])
    const distractors: string[] = []
    for (const c of shuffleArray(allChars.filter(c => c !== targetChar))) {
      if (distractors.length >= 3) break
      const py = getCharPinyin(c)
      if (!usedPinyins.has(py)) {
        distractors.push(c)
        usedPinyins.add(py)
      }
    }
    const allOptions = shuffleArray([targetChar, ...distractors])

    setOptions(allOptions)
    setIsAnswered(false)
    setSelectedChar(null)
    setIsCorrect(null)
    setShowFeedback(false)

    // 自动播放发音，延迟 400ms 等动画完成；2s 超时防止 autoplay 被拦截后卡住
    setIsPlaying(true)
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const raceTimeout = new Promise<void>(r => setTimeout(r, 2000))
        await Promise.race([playChar(targetChar), raceTimeout])
      } catch {
        // autoplay blocked, ignore
      } finally {
        if (!cancelled) setIsPlaying(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
      setIsPlaying(false)
    }
  }, [targetChar, allChars])

  const handleSpeak = async () => {
    setIsPlaying(true)
    try {
      await playChar(targetChar)
    } catch (error) {
      console.error('语音播放失败:', error)
    } finally {
      setTimeout(() => setIsPlaying(false), 500)
    }
  }

  const handleCharClick = (char: string) => {
    if (isAnswered) return

    setIsAnswered(true)
    setSelectedChar(char)
    const correct = char === targetChar
    setIsCorrect(correct)
    setShowFeedback(true)

    if (correct) {
      onCorrect()
      playCorrectSound()
    } else {
      onWrong()
      playWrongSound()
    }

    // 撒花效果持续1秒后隐藏
    setTimeout(() => {
      setShowFeedback(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg -mt-28">
      {/* 进度条 */}
      <div className="w-full mb-10">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>第 {currentIndex + 1} 题</span>
          <span>共 {total} 题</span>
        </div>
        <div className="progress-bar h-2">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 发音按钮 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center mb-10"
      >
        <p className="text-gray-500 text-sm mb-3">点击按钮听发音</p>
        <SpeakerButton onClick={handleSpeak} isPlaying={isPlaying} />
      </motion.div>

      {/* 汉字选项 - 一排四个 */}
      <div className="flex justify-center gap-4 w-full mb-10">
        {options.map((char, index) => (
          <motion.div
            key={`${char}-${index}`}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CharButton
              char={char}
              isSelected={selectedChar === char}
              isCorrect={char === targetChar ? true : selectedChar === char ? false : null}
              showResult={isAnswered}
              onClick={() => handleCharClick(char)}
              disabled={isAnswered}
            />
          </motion.div>
        ))}
      </div>

      {/* 答题后显示拼音 */}
      <div className="h-8 flex items-center justify-center">
        {isAnswered && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 text-sm"
          >
            {targetChar} = <span className="font-bold text-primary-coral">{getCharPinyinWithTone(targetChar)}</span>
          </motion.p>
        )}
      </div>

      {/* Next 按钮 */}
      <div className="h-14 flex items-center justify-center mt-1">
        {isAnswered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1, delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className="px-8 py-3 bg-gradient-to-r from-primary-coral to-primary-yellow text-white font-bold rounded-2xl shadow-lg"
          >
            下一题 →
          </motion.button>
        )}
      </div>

      {/* 反馈动画（撒花效果） */}
      <FeedbackOverlay
        show={showFeedback}
        isCorrect={isCorrect || false}
      />
    </div>
  )
}
