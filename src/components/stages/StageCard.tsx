'use client'

import { motion } from 'framer-motion'
import { Star, Lock, Layers } from 'lucide-react'
import { StageInfo } from '@/types'

interface StageCardProps {
  stage: StageInfo
  completed: number
  isLocked?: boolean
  onClick: () => void
}

export default function StageCard({ stage, completed, isLocked = false, onClick }: StageCardProps) {
  const progress = (completed / stage.totalUnits) * 100
  const isComplete = completed === stage.totalUnits

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.02, y: -5 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={!isLocked ? onClick : undefined}
      className={`
        relative p-6 rounded-3xl shadow-lg cursor-pointer overflow-hidden
        ${isLocked 
          ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
          : 'bg-white hover:shadow-xl'
        }
        transition-shadow duration-300
      `}
    >
      {/* 背景装饰 */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
        style={{ 
          background: `linear-gradient(135deg, ${
            stage.stage === 1 ? '#FF6B6B, #FFE66D' :
            stage.stage === 2 ? '#4ECDC4, #95E1D3' :
            stage.stage === 3 ? '#74B9FF, #A29BFE' :
            '#FDCB6E, #E17055'
          })`
        }}
      />

      {/* 完成标记 */}
      {isComplete && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4"
        >
          <div className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className="w-4 h-4 text-functional-star fill-functional-star"
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* 锁定标记 */}
      {isLocked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* 阶段编号 */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4"
        style={{
          background: `linear-gradient(135deg, ${
            stage.stage === 1 ? '#FF6B6B, #FFE66D' :
            stage.stage === 2 ? '#4ECDC4, #95E1D3' :
            stage.stage === 3 ? '#74B9FF, #A29BFE' :
            '#FDCB6E, #E17055'
          })`
        }}
      >
        {stage.stage}
      </div>

      {/* 阶段信息 */}
      <h3 className="text-xl font-bold text-gray-800 mb-1">
        {stage.name}
        {stage.hasParts && (
          <span className="ml-2 text-sm font-normal text-primary-coral">
            4 部分
          </span>
        )}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {stage.description}
      </p>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="progress-bar">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">
            {completed} / {stage.totalUnits} 单元
          </span>
          <span className="text-gray-400">
            {stage.totalChars} 字
          </span>
        </div>
      </div>

      {/* 多部分提示 */}
      {stage.hasParts && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
          <Layers className="w-4 h-4" />
          <span>包含 4 个学习部分</span>
        </div>
      )}
    </motion.div>
  )
}
