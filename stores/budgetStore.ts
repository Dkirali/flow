import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'
import { db } from '@/db/client'
import { incomeSources, mandatoryExpenses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { calculateDailyBudget } from '@/utils/budgetCalculator'
import type { IncomeSource, NewIncomeSource, MandatoryExpense, NewMandatoryExpense } from '@/types/transaction'

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

interface BudgetStore {
  incomeSources: IncomeSource[]
  mandatoryExpenses: MandatoryExpense[]
  dailyBudget: number
  recalculate: () => void
  fetchIncomeSources: () => Promise<void>
  fetchMandatoryExpenses: () => Promise<void>
  addIncomeSource: (source: NewIncomeSource) => Promise<void>
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => Promise<void>
  deleteIncomeSource: (id: string) => Promise<void>
  addMandatoryExpense: (expense: NewMandatoryExpense) => Promise<void>
  updateMandatoryExpense: (id: string, updates: Partial<MandatoryExpense>) => Promise<void>
  deleteMandatoryExpense: (id: string) => Promise<void>
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      incomeSources: [],
      mandatoryExpenses: [],
      dailyBudget: 0,

      recalculate: () => {
        const monthlyIncome = get().incomeSources.reduce(
          (sum, source) => sum + source.amount, 0
        )
        const dailyBudget = calculateDailyBudget(
          monthlyIncome,
          get().mandatoryExpenses
        )
        set({ dailyBudget })
      },

      fetchIncomeSources: async () => {
        try {
          const sources = await db.select().from(incomeSources)
          set({ incomeSources: sources as IncomeSource[] })
          get().recalculate()
        } catch (error) {
          console.error('Failed to fetch income sources:', error)
        }
      },

      fetchMandatoryExpenses: async () => {
        try {
          const expenses = await db.select().from(mandatoryExpenses)
          set({ mandatoryExpenses: expenses as MandatoryExpense[] })
          get().recalculate()
        } catch (error) {
          console.error('Failed to fetch mandatory expenses:', error)
        }
      },

      addIncomeSource: async (newSource) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        
        const sourceToInsert = {
          ...newSource,
          id,
          createdAt: now,
          isRecurring: newSource.isRecurring ?? true,
          currencyCode: newSource.currencyCode ?? 'USD',
        }

        try {
          await db.insert(incomeSources).values(sourceToInsert)
          await get().fetchIncomeSources()
        } catch (error) {
          console.error('Failed to add income source:', error)
          throw error
        }
      },

      updateIncomeSource: async (id, updates) => {
        try {
          await db.update(incomeSources).set(updates).where(eq(incomeSources.id, id))
          await get().fetchIncomeSources()
        } catch (error) {
          console.error('Failed to update income source:', error)
          throw error
        }
      },

      deleteIncomeSource: async (id) => {
        try {
          await db.delete(incomeSources).where(eq(incomeSources.id, id))
          await get().fetchIncomeSources()
        } catch (error) {
          console.error('Failed to delete income source:', error)
          throw error
        }
      },

      addMandatoryExpense: async (newExpense) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        
        const expenseToInsert = {
          ...newExpense,
          id,
          createdAt: now,
          isRecurring: newExpense.isRecurring ?? true,
        }

        try {
          await db.insert(mandatoryExpenses).values(expenseToInsert)
          await get().fetchMandatoryExpenses()
        } catch (error) {
          console.error('Failed to add mandatory expense:', error)
          throw error
        }
      },

      updateMandatoryExpense: async (id, updates) => {
        try {
          await db.update(mandatoryExpenses).set(updates).where(eq(mandatoryExpenses.id, id))
          await get().fetchMandatoryExpenses()
        } catch (error) {
          console.error('Failed to update mandatory expense:', error)
          throw error
        }
      },

      deleteMandatoryExpense: async (id) => {
        try {
          await db.delete(mandatoryExpenses).where(eq(mandatoryExpenses.id, id))
          await get().fetchMandatoryExpenses()
        } catch (error) {
          console.error('Failed to delete mandatory expense:', error)
          throw error
        }
      },
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the computed dailyBudget to MMKV
      // Income sources and mandatory expenses are stored in SQLite only
      partialize: (state) => ({
        dailyBudget: state.dailyBudget,
      }),
    }
  )
)
