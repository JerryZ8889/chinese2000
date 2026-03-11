'use client'

import { motion } from 'framer-motion'
import { Star, Play } from 'lucide-react'

interface UnitGridProps {
  totalUnits: number
  completedUnits: number[]
  currentUnit: number
  startUnit?: number  // 起始单元号，默认为1
  onUnitClick: (unit: number) => void
}

export default function UnitGrid({ 
  totalUnits, 
  completedUnits, 
  currentUnit, 
  startUnit = 1,
  onUnitClick 
}: UnitGridProps) {
  const units = Array.from({ length: totalUnits }, (_, i) => i + 1)

  const getUnitStatus = (unit: number): 'completed' | 'current' | 'locked' => {
    // 将局部单元号转换为全局单元号进行比较
    const globalUnit = startUnit + unit - 1
    if (completedUnits.includes(globalUnit)) return 'completed'
    if (unit <= currentUnit) return 'current'
    return 'locked'
  }

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
      {units.map((unit, index) => {
        const status = getUnitStatus(unit)
        const isCompleted = status === 'completed'
        const isCurrent = status === 'current'
        const isLocked = status === 'locked'
        const displayUnit = startUnit + unit - 1  // 显示的单元号

        return (
          <motion.button
            key={unit}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={!isLocked ? { scale: 1.1 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            onClick={() => !isLocked && onUnitClick(unit)}
            disabled={isLocked}
            className={`
              aspect-square rounded-2xl flex items-center justify-center
              text-lg font-bold transition-all duration-200
              ${isCompleted
                ? 'bg-gradient-to-br from-functional-success to-teal-400 text-white shadow-lg'
                : isCurrent
                ? 'bg-gradient-to-br from-primary-coral to-primary-yellow text-white shadow-lg ring-4 ring-primary-coral/30'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }
            `}
          >
            {isCompleted ? (
              <div className="flex flex-col items-center">
                <span>{displayUnit}</span>
                <Star className="w-3 h-3 mt-0.5 fill-white" />
              </div>
            ) : isCurrent ? (
              <div className="flex flex-col items-center">
                <span>{displayUnit}</span>
                <Play className="w-3 h-3 mt-0.5" />
              </div>
            ) : (
              <span>{displayUnit}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
