'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface FeedbackOverlayProps {
  show: boolean
  isCorrect: boolean
  correctChar?: string
}

// 撒花粒子配置
const confettiColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#FDCB6E', '#74B9FF']

// 生成随机撒花粒子
const generateConfetti = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    y: Math.random() * 300 - 150,
    rotation: Math.random() * 720 - 360,
    scale: 0.5 + Math.random() * 0.5,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    delay: Math.random() * 0.3,
    shape: ['🎉', '✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 5)]
  }))
}

export default function FeedbackOverlay({ show, isCorrect }: FeedbackOverlayProps) {
  const confetti = generateConfetti(12)

  return (
    <AnimatePresence>
      {show && isCorrect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
        >
          {/* 撒花效果 */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                opacity: 1
              }}
              animate={{ 
                x: particle.x,
                y: particle.y,
                scale: particle.scale,
                opacity: 0,
                rotate: particle.rotation
              }}
              transition={{ 
                duration: 1,
                delay: particle.delay,
                ease: 'easeOut'
              }}
              className="absolute text-3xl"
              style={{ color: particle.color }}
            >
              {particle.shape}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
