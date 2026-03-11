'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, LogOut, Calendar, User, CheckCircle, XCircle } from 'lucide-react'
import { getAllUsers, createUser, updateUser, deleteUser, checkUserExpired } from '@/lib/supabase/users'
import { User as UserType } from '@/types'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    expireAt: ''
  })

  useEffect(() => {
    // 检查登录状态
    const isAuth = sessionStorage.getItem('adminAuth')
    if (!isAuth) {
      router.push('/admin')
      return
    }

    loadUsers()
  }, [router])

  const loadUsers = async () => {
    try {
      const { data } = await getAllUsers()
      if (data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('加载用户失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    router.push('/admin')
  }

  const handleOpenModal = (user?: UserType) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        expireAt: user.expire_at ? user.expire_at.split('T')[0] : ''
      })
    } else {
      setEditingUser(null)
      setFormData({ username: '', expireAt: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ username: '', expireAt: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          username: formData.username,
          expire_at: formData.expireAt || null
        })
      } else {
        await createUser(formData.username, formData.expireAt)
      }
      
      await loadUsers()
      handleCloseModal()
    } catch (error) {
      console.error('保存用户失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleDelete = async (user: UserType) => {
    if (!confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`)) {
      return
    }

    try {
      await deleteUser(user.id)
      await loadUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除失败，请重试')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {/* 头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-coral text-white rounded-xl"
          >
            <Plus className="w-5 h-5" />
            添加用户
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            退出
          </motion.button>
        </div>
      </motion.header>

      {/* 用户列表 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">用户名</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">有效期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">创建时间</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isExpired = checkUserExpired(user)
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-coral/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-coral" />
                          </div>
                          <span className="font-medium text-gray-800">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {user.expire_at ? user.expire_at.split('T')[0] : '永久有效'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isExpired ? (
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="w-4 h-4" />
                            已过期
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-functional-success">
                            <CheckCircle className="w-4 h-4" />
                            正常
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {user.created_at.split('T')[0]}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 添加/编辑用户弹窗 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingUser ? '编辑用户' : '添加用户'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-coral focus:outline-none focus:ring-2 focus:ring-primary-coral/20"
                  placeholder="输入用户名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有效期（留空则永久有效）
                </label>
                <input
                  type="date"
                  value={formData.expireAt}
                  onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-coral focus:outline-none focus:ring-2 focus:ring-primary-coral/20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-coral text-white font-medium rounded-xl hover:bg-primary-coral/90"
                >
                  保存
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </main>
  )
}
