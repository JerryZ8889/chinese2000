'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft } from 'lucide-react'

// 简单密码保护 - 实际项目中应该从环境变量读取并加密存储
const ADMIN_PASSWORD = 'admin'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // 简单密码验证
    if (password === ADMIN_PASSWORD) {
      // 存储登录状态
      sessionStorage.setItem('adminAuth', 'true')
      router.push('/admin/dashboard')
    } else {
      setError('密码错误')
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-100">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 shadow-lg w-full max-w-md"
      >
        {/* 返回按钮 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/')}
          className="mb-6 p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">管理后台</h1>
          <p className="text-gray-500 mt-2">请输入管理密码</p>
        </div>

        {/* 密码表单 */}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-primary-coral focus:outline-none focus:ring-4 focus:ring-primary-coral/20 mb-4"
          />
          
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm text-center mb-4"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="w-full py-4 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-700 disabled:opacity-50"
          >
            {isLoading ? '验证中...' : '进入后台'}
          </motion.button>
        </form>
      </motion.div>
    </main>
  )
}
