'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Sparkles, Play } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getUserByUsername } from '@/lib/supabase/users'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { setUser } = useStore()

  const handleLogin = async () => {
    const trimmedUsername = username.trim()
    
    if (!trimmedUsername) {
      setError('请输入你的名字')
      return
    }

    if (trimmedUsername.length < 2) {
      setError('用户名至少需要 2 个字符')
      return
    }

    if (trimmedUsername.length > 20) {
      setError('用户名不能超过 20 个字符')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 从数据库验证用户
      const user = await getUserByUsername(trimmedUsername)

      if (!user) {
        setError('用户名不存在，请联系管理员添加')
        setIsLoading(false)
        return
      }

      // 检查是否过期
      if (user.expire_at && new Date(user.expire_at) < new Date()) {
        setError('账号已过期，请联系管理员续期')
        setIsLoading(false)
        return
      }

      // 存储用户信息到 Zustand
      setUser(user)
      
      router.push('/stages')
    } catch (err) {
      console.error('登录失败:', err)
      setError('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 text-6xl"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ☁️
        </motion.div>
        <motion.div
          className="absolute top-32 right-20 text-5xl"
          animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          ☁️
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-20 text-4xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⭐
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-32 text-4xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          ⭐
        </motion.div>
      </div>

      {/* 主内容 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8 z-10"
      >
        {/* Logo 和标题 */}
        <motion.div
          className="flex flex-col items-center gap-4"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-6xl mb-2">
            <Sparkles className="w-16 h-16 text-primary-yellow" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-coral via-primary-yellow to-primary-teal bg-clip-text text-transparent">
            汉字小达人
          </h1>
          <p className="text-gray-500 text-lg">开始你的识字冒险吧！</p>
        </motion.div>

        {/* 登录表单 */}
        <motion.div
          className="flex flex-col items-center gap-4 w-full max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="请输入你的名字"
            maxLength={20}
            className="w-full px-6 py-4 text-xl text-center rounded-2xl border-2 border-primary-coral/30 focus:border-primary-coral focus:outline-none focus:ring-4 focus:ring-primary-coral/20 transition-all bg-white shadow-lg"
          />
          
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            onClick={handleLogin}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-8 py-4 bg-gradient-to-r from-primary-coral to-primary-yellow text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <Play className="w-5 h-5" />
                开始学习
              </>
            )}
          </motion.button>
        </motion.div>

        {/* 管理入口 */}
        <motion.a
          href="/admin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-4"
        >
          管理入口
        </motion.a>
      </motion.div>
    </main>
  )
}
