import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'
import { getCurrencyByCode } from '@/constants/currencies'

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

interface NotificationSettings {
  dailyReminder: boolean
  dailyReminderTime: string
  budgetAlert: boolean
  budgetAlertThreshold: number
  paydayReminder: boolean
  monthlyReport: boolean
  recurringAlert: boolean
}

interface SettingsStore {
  currency: string
  currencySymbol: string
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  aiEnabled: boolean
  aiDataScope: '1M' | '3M' | '6M' | 'all'
  investmentComparisons: boolean
  notifications: NotificationSettings
  setCurrency: (code: string) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setAccentColor: (color: string) => void
  setAiEnabled: (enabled: boolean) => void
  setAiDataScope: (scope: '1M' | '3M' | '6M' | 'all') => void
  setInvestmentComparisons: (enabled: boolean) => void
  setNotification: (key: keyof NotificationSettings, value: boolean | string | number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      currency: 'USD',
      currencySymbol: '$',
      theme: 'dark',
      accentColor: '#6C63FF',
      aiEnabled: true,
      aiDataScope: '3M',
      investmentComparisons: true,
      notifications: {
        dailyReminder: true,
        dailyReminderTime: '21:00',
        budgetAlert: true,
        budgetAlertThreshold: 80,
        paydayReminder: true,
        monthlyReport: false,
        recurringAlert: false,
      },
      setCurrency: (code) => {
        const currency = getCurrencyByCode(code)
        set({ currency: code, currencySymbol: currency.symbol })
      },
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
      setAiDataScope: (scope) => set({ aiDataScope: scope }),
      setInvestmentComparisons: (enabled) => set({ investmentComparisons: enabled }),
      setNotification: (key, value) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: value,
          },
        })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
