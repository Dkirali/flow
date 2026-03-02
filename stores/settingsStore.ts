import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getCurrencyByCode } from '@/constants/currencies'

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
  // Income settings
  monthlyIncome: number
  paydayDay: number
  paydayFrequency: 'weekly' | 'bi-weekly' | 'monthly'
  setCurrency: (code: string) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setAccentColor: (color: string) => void
  setAiEnabled: (enabled: boolean) => void
  setAiDataScope: (scope: '1M' | '3M' | '6M' | 'all') => void
  setInvestmentComparisons: (enabled: boolean) => void
  setNotification: (key: keyof NotificationSettings, value: boolean | string | number) => void
  // Income methods
  setIncome: (income: number, paydayDay: number, frequency: 'weekly' | 'bi-weekly' | 'monthly') => void
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
      // Income defaults
      monthlyIncome: 0,
      paydayDay: 1,
      paydayFrequency: 'monthly' as 'weekly' | 'bi-weekly' | 'monthly',
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
      // Income method
      setIncome: (income, paydayDay, frequency) =>
        set({ monthlyIncome: income, paydayDay, paydayFrequency: frequency }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
