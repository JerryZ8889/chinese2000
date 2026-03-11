import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppState, User } from '@/types'

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentStage: null,
      currentUnit: null,
      setUser: (user: User | null) => set({ user }),
      setCurrentStage: (stage: number | null) => set({ currentStage: stage }),
      setCurrentUnit: (unit: number | null) => set({ currentUnit: unit }),
      logout: () => set({ user: null, currentStage: null, currentUnit: null }),
    }),
    {
      name: 'literacy-storage',
    }
  )
)
