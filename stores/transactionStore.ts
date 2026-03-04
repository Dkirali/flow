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
  getTotalIncome: () => number
  recalculateIncome: () => void
  clearAll: () => Promise<void>
}

// Helper to calculate total income from all income transactions
function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
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
      console.error('Failed to fetch transactions:', error)
      throw new Error('Unable to load transactions. Please try again.')
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

      // Update monthlyIncome when income transaction is added
      if (newTransaction.type === 'income') {
        const currentTransactions = get().transactions
        const totalIncome = calculateTotalIncome(currentTransactions)
        const { paydayDay, paydayFrequency } = useSettingsStore.getState()
        useSettingsStore.getState().setIncome(totalIncome, paydayDay, paydayFrequency)
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
          const { notifications, currencySymbol } = useSettingsStore.getState()
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
                  body: `You have used ${Math.round(100 - percentage)}% of today's budget. ${currencySymbol}${remaining.toFixed(2)} remaining.`,
                },
                trigger: null, // fires immediately
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to add transaction:', error)
      throw new Error('Failed to save transaction. Please try again.')
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      const original = get().transactions.find(t => t.id === id)
      if (!original) {
        throw new Error('Transaction not found')
      }

      await db.update(transactions).set(updates).where(eq(transactions.id, id))
      await get().fetchAll()

      // Sync mandatory expense if this was a mandatory expense being updated
      if (original?.isMandatory && original?.type === 'expense' && updates.amount !== undefined) {
        const { mandatoryExpenses, updateMandatoryExpense } = useBudgetStore.getState()
        const match = mandatoryExpenses.find(e => e.name === (original.note ?? original.category))
        if (match) {
          await updateMandatoryExpense(match.id, {
            amount: updates.amount,
            category: updates.category ?? original.category,
          })
        }
      }

      // Recalculate income if this was an income transaction
      if (original?.type === 'income') {
        const currentTransactions = get().transactions
        const totalIncome = calculateTotalIncome(currentTransactions)
        const { paydayDay, paydayFrequency } = useSettingsStore.getState()
        useSettingsStore.getState().setIncome(totalIncome, paydayDay, paydayFrequency)
      }

      // Recalculate budget
      useBudgetStore.getState().recalculate()
    } catch (error) {
      console.error('Failed to update transaction:', error)
      throw new Error('Failed to update transaction. Please try again.')
    }
  },

  deleteTransaction: async (id) => {
    try {
      const txn = get().transactions.find(t => t.id === id)
      if (!txn) {
        throw new Error('Transaction not found')
      }

      await db.delete(transactions).where(eq(transactions.id, id))
      await get().fetchAll()

      // Remove from mandatory expenses when a mandatory expense transaction is deleted
      if (txn?.isMandatory && txn?.type === 'expense') {
        const name = txn.note ?? txn.category
        const { mandatoryExpenses, deleteMandatoryExpense } = useBudgetStore.getState()
        const match = mandatoryExpenses.find(e => e.name === name)
        if (match) await deleteMandatoryExpense(match.id)
      }

      // Recalculate income if this was an income transaction
      if (txn?.type === 'income') {
        const currentTransactions = get().transactions
        const totalIncome = calculateTotalIncome(currentTransactions)
        const { paydayDay, paydayFrequency } = useSettingsStore.getState()
        useSettingsStore.getState().setIncome(totalIncome, paydayDay, paydayFrequency)
      }

      // Recalculate budget
      useBudgetStore.getState().recalculate()
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      throw new Error('Failed to delete transaction. Please try again.')
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

    // Recalculate income after currency conversion
    const currentTransactions = get().transactions
    const totalIncome = calculateTotalIncome(currentTransactions)
    const { paydayDay, paydayFrequency } = useSettingsStore.getState()
    useSettingsStore.getState().setIncome(totalIncome, paydayDay, paydayFrequency)
    
    useBudgetStore.getState().recalculate()
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

  getTotalIncome: () => {
    return calculateTotalIncome(get().transactions)
  },

  recalculateIncome: () => {
    const currentTransactions = get().transactions
    const totalIncome = calculateTotalIncome(currentTransactions)
    const { paydayDay, paydayFrequency } = useSettingsStore.getState()
    useSettingsStore.getState().setIncome(totalIncome, paydayDay, paydayFrequency)
    useBudgetStore.getState().recalculate()
  },

  clearAll: async () => {
    try {
      // Delete all transactions from database
      await db.delete(transactions)
      set({ transactions: [] })

      // Reset income to 0
      const { paydayDay, paydayFrequency } = useSettingsStore.getState()
      useSettingsStore.getState().setIncome(0, paydayDay, paydayFrequency)

      // Clear all mandatory expenses
      const { mandatoryExpenses, deleteMandatoryExpense } = useBudgetStore.getState()
      for (const expense of mandatoryExpenses) {
        await deleteMandatoryExpense(expense.id)
      }

      // Recalculate budget (should be 0)
      await useBudgetStore.getState().recalculate()
    } catch (error) {
      console.error('Failed to clear transactions:', error)
      throw new Error('Failed to clear transactions. Please try again.')
    }
  },
}))
