'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface CharButtonProps {
  char: string
  isSelected?: boolean
  isCorrect?: boolean | null
  showResult?: boolean
  onClick: () => void
  disabled?: boolean
}

export default function CharButton({ 
  char, 
  isSelected = false, 
  isCorrect = null, 
  showResult = false,
  onClick,
  disabled = false
}: CharButtonProps) {
  const getButtonStyle = () => {
    if (!showResult) {
      return 'bg-white border-2 border-gray-200 hover:border-primary-coral hover:bg-primary-coral/5 text-gray-800 shadow-md hover:shadow-lg'
    }
    
    if (isCorrect === true) {
      return 'bg-gradient-to-br from-functional-success to-teal-400 border-2 border-functional-success text-white shadow-lg'
    }
    
    if (isCorrect === false && isSelected) {
      return 'bg-gradient-to-br from-red-400 to-red-500 border-2 border-red-400 text-white shadow-lg'
    }
    
    return 'bg-gray-50 border-2 border-gray-100 text-gray-300'
  }

  return (
    <motion.button
      whileHover={!disabled && !showResult ? { scale: 1.08, y: -2 } : {}}
      whileTap={!disabled && !showResult ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled || showResult}
      className={`
        relative flex flex-col items-center justify-center
        w-20 h-20 rounded-2xl
        text-4xl font-bold
        ${getButtonStyle()}
        ${isSelected && !showResult ? 'ring-4 ring-primary-coral/30 border-primary-coral' : ''}
        transition-colors duration-150
      `}
    >
      <span className="relative z-10">{char}</span>
      
      {/* 错误图标 - 只在选错时显示 */}
      {showResult && isCorrect === false && isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2"
        >
          <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-md border-2 border-white">
            <X className="w-4 h-4 text-white" />
          </div>
        </motion.div>
      )}
    </motion.button>
  )
}
