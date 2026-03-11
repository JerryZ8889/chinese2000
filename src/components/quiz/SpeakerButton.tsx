'use client'

import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'

interface SpeakerButtonProps {
  onClick: () => void
  isPlaying?: boolean
}

export default function SpeakerButton({ onClick, isPlaying = false }: SpeakerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-teal to-primary-mint text-white shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* 涟漪效果 */}
      {isPlaying && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary-teal"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary-teal"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
      
      <Volume2 className={`w-10 h-10 mx-auto ${isPlaying ? 'animate-pulse' : ''}`} />
    </motion.button>
  )
}
