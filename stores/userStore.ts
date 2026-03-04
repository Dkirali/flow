import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

function isValidEmail(email: string): boolean {
  if (!email) return true // Empty email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface UserStore {
  name: string
  email: string
  isOnboardingComplete: boolean
  emailError: string | null
  setName: (name: string) => void
  setEmail: (email: string) => void
  completeOnboarding: () => void
  clearEmailError: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      name: '',
      email: '',
      isOnboardingComplete: false,
      emailError: null,
      setName: (name) => set({ name }),
      setEmail: (email) => {
        if (!isValidEmail(email)) {
          set({ email, emailError: 'Please enter a valid email address' })
        } else {
          set({ email, emailError: null })
        }
      },
      clearEmailError: () => set({ emailError: null }),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
