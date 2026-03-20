'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import stories from '@/data/camela-stories.json'

interface CharacterEntry {
  name: string
  description: string
  books: number[] // which books they appear in
}

export default function CharactersPage() {
  const router = useRouter()

  // Merge all characters across books, dedup by name
  const allCharacters = useMemo(() => {
    const map = new Map<string, CharacterEntry>()

    stories.forEach(book => {
      book.characters.forEach(ch => {
        const existing = map.get(ch.name)
        if (existing) {
          if (!existing.books.includes(book.id)) {
            existing.books.push(book.id)
          }
          // Keep longer description
          if (ch.description.length > existing.description.length) {
            existing.description = ch.description
          }
        } else {
          map.set(ch.name, {
            name: ch.name,
            description: ch.description,
            books: [book.id],
          })
        }
      })
    })

    // Sort by number of appearances (desc), then by first appearance
    return Array.from(map.values()).sort((a, b) => {
      if (b.books.length !== a.books.length) return b.books.length - a.books.length
      return a.books[0] - b.books[0]
    })
  }, [])

  const getAppearanceLabel = (books: number[]) => {
    if (books.length >= 10) return '主角'
    if (books.length >= 4) return '常驻'
    if (books.length >= 2) return '多次出场'
    return `第 ${books[0]} 册`
  }

  const getAppearanceColor = (books: number[]) => {
    if (books.length >= 10) return 'bg-violet-100 text-violet-700'
    if (books.length >= 4) return 'bg-amber-100 text-amber-700'
    if (books.length >= 2) return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <main className="min-h-screen p-6 pb-10">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/camela/stories')}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">🎭 角色大集合</h1>
          <p className="text-sm text-gray-500">共 {allCharacters.length} 个角色</p>
        </div>
      </motion.header>

      <div className="space-y-3">
        {allCharacters.map((ch, index) => (
          <motion.div
            key={ch.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + index * 0.03 }}
            className="bg-white rounded-2xl shadow-sm p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-lg font-bold text-violet-600 flex-shrink-0">
                {ch.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800">{ch.name}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getAppearanceColor(ch.books)}`}>
                    {getAppearanceLabel(ch.books)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{ch.description}</p>
                {ch.books.length > 1 && (
                  <p className="text-xs text-gray-400 mt-1">
                    出场：第 {ch.books.join('、')} 册
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  )
}
