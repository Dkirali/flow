import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { generateId } from '@/utils/generateId'
import { db } from '@/db/client'
import { incomeSources, mandatoryExpenses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { calculateDailyBudget } from '@/utils/budgetCalculator'
import type { IncomeSource, NewIncomeSource, MandatoryExpense, NewMandatoryExpense } from '@/types/transaction'

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
          
        }
      },

      fetchMandatoryExpenses: async () => {
        try {
          const expenses = await db.select().from(mandatoryExpenses)
          set({ mandatoryExpenses: expenses as MandatoryExpense[] })
          get().recalculate()
        } catch (error) {
          
        }
      },

      addIncomeSource: async (newSource) => {
        const id = generateId()
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
          
          throw error
        }
      },

      updateIncomeSource: async (id, updates) => {
        try {
          await db.update(incomeSources).set(updates).where(eq(incomeSources.id, id))
          await get().fetchIncomeSources()
        } catch (error) {
          
          throw error
        }
      },

      deleteIncomeSource: async (id) => {
        try {
          await db.delete(incomeSources).where(eq(incomeSources.id, id))
          await get().fetchIncomeSources()
        } catch (error) {
          
          throw error
        }
      },

      addMandatoryExpense: async (newExpense) => {
        const id = generateId()
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
          
          throw error
        }
      },

      updateMandatoryExpense: async (id, updates) => {
        try {
          await db.update(mandatoryExpenses).set(updates).where(eq(mandatoryExpenses.id, id))
          await get().fetchMandatoryExpenses()
        } catch (error) {
          
          throw error
        }
      },

      deleteMandatoryExpense: async (id) => {
        try {
          await db.delete(mandatoryExpenses).where(eq(mandatoryExpenses.id, id))
          await get().fetchMandatoryExpenses()
        } catch (error) {
          
          throw error
        }
      },
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the computed dailyBudget to AsyncStorage
      // Income sources and mandatory expenses are stored in SQLite only
      partialize: (state) => ({
        dailyBudget: state.dailyBudget,
      }),
    }
  )
)
