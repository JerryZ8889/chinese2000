'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { getBadgeById, BadgeDefinition } from '@/data/badges'

interface NewBadgeModalProps {
  badgeIds: string[]
  onClose: () => void
}

export default function NewBadgeModal({ badgeIds, onClose }: NewBadgeModalProps) {
  const badges = badgeIds
    .map(id => getBadgeById(id))
    .filter(Boolean) as BadgeDefinition[]

  if (badges.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-5xl mb-3"
          >
            🎉
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">解锁新成就！</h2>
          <p className="text-gray-400 text-sm mb-6">
            {badges.length > 1 ? `同时获得 ${badges.length} 个徽章` : '恭喜你！'}
          </p>

          <div className="flex flex-col gap-3 mb-6">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 bg-gradient-to-r from-primary-coral/10 to-primary-yellow/10 rounded-2xl p-4"
              >
                <span className="text-4xl">{badge.emoji}</span>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-base">{badge.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-primary-coral to-primary-yellow text-white font-bold rounded-2xl text-lg"
          >
            太棒了！
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
