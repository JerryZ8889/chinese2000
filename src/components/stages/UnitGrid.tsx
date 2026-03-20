'use client'

import { motion } from 'framer-motion'
import { Star, Play } from 'lucide-react'
import { unlockAudio } from '@/lib/utils/audio-unlock'

interface UnitScore {
  score: number
  total: number
}

interface UnitGridProps {
  totalUnits: number
  completedUnits: number[]
  unitScores?: Map<number, UnitScore>  // unit number → score/total
  currentUnit: number
  startUnit?: number
  onUnitClick: (unit: number) => void
}

const getStarCount = (score: number, total: number) => {
  if (total === 0) return 1
  const pct = (score / total) * 100
  return pct >= 90 ? 3 : pct >= 50 ? 2 : 1
}

export default function UnitGrid({
  totalUnits,
  completedUnits,
  unitScores,
  currentUnit,
  startUnit = 1,
  onUnitClick
}: UnitGridProps) {
  const units = Array.from({ length: totalUnits }, (_, i) => i + 1)

  const getUnitStatus = (unit: number): 'completed' | 'current' | 'locked' => {
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
        const displayUnit = startUnit + unit - 1
        const globalUnit = startUnit + unit - 1
        const scoreData = unitScores?.get(globalUnit)
        const stars = scoreData ? getStarCount(scoreData.score, scoreData.total) : 1

        return (
          <motion.button
            key={unit}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={!isLocked ? { scale: 1.1 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            onClick={() => { if (!isLocked) { unlockAudio(); onUnitClick(unit) } }}
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
                <span className="text-sm">{displayUnit}</span>
                <div className="flex gap-px mt-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-white text-white" />
                  ))}
                </div>
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
