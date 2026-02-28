import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
