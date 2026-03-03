import { create } from 'zustand'
import { generateId } from '@/utils/generateId'
import { db } from '@/db/client'
import { transactions } from '@/db/schema'
import { eq, and, between } from 'drizzle-orm'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Transaction, NewTransaction } from '@/types/transaction'
import { getTodayString } from '@/utils/dateHelpers'
import { calculateRemainingToday, getRemainingPercentage } from '@/utils/budgetCalculator'
import { useBudgetStore } from './budgetStore'
import { useSettingsStore } from './settingsStore'

interface TransactionStore {
  transactions: Transaction[]
  isLoading: boolean
  fetchAll: () => Promise<void>
  addTransaction: (transaction: NewTransaction) => Promise<void>
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  convertAllCurrencies: (newCurrency: string, rates: Record<string, number>) => Promise<void>
  getByDate: (date: string) => Transaction[]
  getByMonth: (year: number, month: number) => Transaction[]
  getTodayExpenses: () => Transaction[]
  clearAll: () => Promise<void>
}

export const useTransactionStore = create<TransactionStore>()((set, get) => ({
  transactions: [],
  isLoading: false,

  fetchAll: async () => {
    set({ isLoading: true })
    try {
      const allTransactions = await db.select().from(transactions)
      set({ transactions: allTransactions as Transaction[] })
    } catch (error) {
      
    } finally {
      set({ isLoading: false })
    }
  },

  addTransaction: async (newTransaction) => {
    const id = generateId()
    const now = new Date().toISOString()

    const transactionToInsert = {
      ...newTransaction,
      id,
      createdAt: now,
      isMandatory: newTransaction.isMandatory ?? false,
      isLeisure: newTransaction.isLeisure ?? false,
      isRecurring: newTransaction.isRecurring ?? false,
      currencyCode: newTransaction.currencyCode ?? 'USD',
    }

    try {
      await db.insert(transactions).values(transactionToInsert)
      await get().fetchAll()

      // Sync monthly income setting whenever an income transaction is added
      if (newTransaction.type === 'income') {
        const incomeTotal = get().transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const { paydayDay, paydayFrequency } = useSettingsStore.getState()
        useSettingsStore.getState().setIncome(incomeTotal, paydayDay || 1, paydayFrequency || 'monthly')
      }

      // Sync mandatory expenses whenever a mandatory expense transaction is added
      if (newTransaction.type === 'expense' && (newTransaction.isMandatory ?? false)) {
        const name = newTransaction.note ?? newTransaction.category
        await useBudgetStore.getState().addMandatoryExpense({
          name,
          amount: newTransaction.amount,
          category: newTransaction.category,
          isRecurring: newTransaction.isRecurring ?? true,
        })
      }

      // Recalculate budget after adding transaction
      useBudgetStore.getState().recalculate()

      // Check if budget alert should fire (only for expenses)
      if (newTransaction.type === 'expense') {
        const { dailyBudget } = useBudgetStore.getState()
        const todayExpenses = get().getTodayExpenses()
        const remaining = calculateRemainingToday(dailyBudget, todayExpenses)
        const percentage = getRemainingPercentage(remaining, dailyBudget)

        if (percentage <= 20 && dailyBudget > 0) {
          const { notifications } = useSettingsStore.getState()
          if (notifications.budgetAlert) {
            // Only fire once per day
            const lastFiredKey = 'budget_alert_last_fired'
            const lastFired = await AsyncStorage.getItem(lastFiredKey)
            const today = getTodayString()

            if (lastFired !== today) {
              await AsyncStorage.setItem(lastFiredKey, today)
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Budget Alert 🟡',
                  body: `You have used ${Math.round(100 - percentage)}% of today's budget. $${remaining.toFixed(2)} remaining.`,
                },
                trigger: null, // fires immediately
              })
            }
          }
        }
      }
    } catch (error) {
      
      throw error
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      await db.update(transactions).set(updates).where(eq(transactions.id, id))
      await get().fetchAll()

      // Sync monthly income if an income transaction was updated
      const updated = get().transactions.find(t => t.id === id)
      if (updated?.type === 'income') {
        const incomeTotal = get().transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
      const { paydayDay, paydayFrequency } = useSettingsStore.getState()
        useSettingsStore.getState().setIncome(incomeTotal, paydayDay || 1, paydayFrequency || 'monthly')
      }
    } catch (error) {

      throw error
    }
  },

  deleteTransaction: async (id) => {
    try {
      const txn = get().transactions.find(t => t.id === id)
      await db.delete(transactions).where(eq(transactions.id, id))
      await get().fetchAll()

      // Sync monthly income setting whenever an income transaction is deleted
      if (txn?.type === 'income') {
        const incomeTotal = get().transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
      const { paydayDay, paydayFrequency } = useSettingsStore.getState()
        useSettingsStore.getState().setIncome(incomeTotal, paydayDay || 1, paydayFrequency || 'monthly')
      }

      // Remove from mandatory expenses when a mandatory expense transaction is deleted
      if (txn?.isMandatory && txn?.type === 'expense') {
        const name = txn.note ?? txn.category
        const { mandatoryExpenses, deleteMandatoryExpense } = useBudgetStore.getState()
        const match = mandatoryExpenses.find(e => e.name === name && e.amount === txn.amount)
        if (match) await deleteMandatoryExpense(match.id)
      }
    } catch (error) {

      throw error
    }
  },

  convertAllCurrencies: async (newCurrency, rates) => {
    const allTxns = get().transactions
    for (const txn of allTxns) {
      const fromCurrency = txn.currencyCode ?? 'USD'
      if (fromCurrency === newCurrency) continue
      const rateFrom = rates[fromCurrency] ?? 1
      const rateTo = rates[newCurrency] ?? 1
      const newAmount = parseFloat((txn.amount * (rateTo / rateFrom)).toFixed(2))
      await db.update(transactions)
        .set({ amount: newAmount, currencyCode: newCurrency })
        .where(eq(transactions.id, txn.id))
    }
    await get().fetchAll()
    // Re-sync monthly income after conversion
    const incomeTotal = get().transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const { paydayDay, paydayFrequency } = useSettingsStore.getState()
    useSettingsStore.getState().setIncome(incomeTotal, paydayDay || 1, paydayFrequency || 'monthly')
  },

  getByDate: (date) => {
    return get().transactions.filter((t) => t.date === date)
  },

  getByMonth: (year, month) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const yearStr = String(year)
    return get().transactions.filter((t) => t.date.startsWith(`${yearStr}-${monthStr}`))
  },

  getTodayExpenses: () => {
    const today = getTodayString()
    return get().transactions.filter((t) => t.date === today && t.type === 'expense')
  },

  clearAll: async () => {
    try {
      await db.delete(transactions)
      set({ transactions: [] })
      const { paydayDay, paydayFrequency } = useSettingsStore.getState()
      useSettingsStore.getState().setIncome(0, paydayDay || 1, paydayFrequency || 'monthly')
      useBudgetStore.getState().recalculate()
    } catch (error) {
      throw error
    }
  },
}))
