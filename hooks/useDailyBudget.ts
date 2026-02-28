import { useMemo } from 'react'
import { useBudgetStore } from '@/stores/budgetStore'
import { useTransactionStore } from '@/stores/transactionStore'
import {
  calculateRemainingToday,
  getRemainingPercentage,
  getRingColor,
} from '@/utils/budgetCalculator'

interface DailyBudgetData {
  dailyBudget: number
  remainingToday: number
  remainingPercentage: number
  ringColor: string
  isOverBudget: boolean
}

export function useDailyBudget(): DailyBudgetData {
  const dailyBudget = useBudgetStore((state) => state.dailyBudget)
  const todayExpenses = useTransactionStore((state) => state.getTodayExpenses())

  return useMemo(() => {
    const remainingToday = calculateRemainingToday(dailyBudget, todayExpenses)
    const remainingPercentage = getRemainingPercentage(remainingToday, dailyBudget)
    const ringColor = getRingColor(remainingPercentage)
    const isOverBudget = remainingToday < 0

    return {
      dailyBudget,
      remainingToday,
      remainingPercentage,
      ringColor,
      isOverBudget,
    }
  }, [dailyBudget, todayExpenses])
}
