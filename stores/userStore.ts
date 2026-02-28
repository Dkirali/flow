import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name)
    return value ? JSON.parse(value) : null
  },
  setItem: (name: string, value: unknown) => {
    storage.set(name, JSON.stringify(value))
  },
  removeItem: (name: string) => {
    storage.delete(name)
  },
}

interface UserStore {
  name: string
  isOnboardingComplete: boolean
  setName: (name: string) => void
  completeOnboarding: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      name: '',
      isOnboardingComplete: false,
      setName: (name) => set({ name }),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
