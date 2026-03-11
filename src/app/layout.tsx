import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '汉字小达人 - 中文识字测试',
  description: '一个有趣的中文学字游戏应用，帮助孩子巩固识字能力',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background-warm">
        {children}
      </body>
    </html>
  )
}
