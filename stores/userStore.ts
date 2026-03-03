import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface UserStore {
  name: string
  email: string
  isOnboardingComplete: boolean
  setName: (name: string) => void
  setEmail: (email: string) => void
  completeOnboarding: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      name: '',
      email: '',
      isOnboardingComplete: false,
      setName: (name) => set({ name }),
      setEmail: (email) => set({ email }),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
