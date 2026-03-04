import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  format,
  subMonths
} from 'date-fns'
import { calculateDailyBudget } from './budgetCalculator'
import { SAVINGS_GOAL_THRESHOLD, DEFAULT_SAVINGS_GOAL_PERCENTAGE } from '@/constants/budget'

// Types
export type TimePeriod = 'day' | 'month' | 'year'

export type ConvertAmount = (amount: number, currencyCode: string) => number

export interface Transaction {
  id: string
  amount: number
  category: string
  description: string
  date: Date
  type: 'income' | 'expense'
  currencyCode?: string
  isMandatory?: boolean
  isLeisure?: boolean
  isRecurring?: boolean
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly'
}

export interface ChartDataPoint {
  label: string
  income: number
  expense: number
  savings: number
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  dailyBudget: number
  remainingBudget: number
  spentToday: number
  daysRemaining: number
}

// Aggregate transactions by time period
export function aggregateTransactionsByPeriod(
  transactions: Transaction[],
  period: TimePeriod,
  convertAmount: ConvertAmount = (a) => a
): ChartDataPoint[] {
  const now = new Date()

  switch (period) {
    case 'day':
      return aggregateByHour(transactions, now, convertAmount)
    case 'month':
      return aggregateByWeek(transactions, now, convertAmount)
    case 'year':
      return aggregateByMonth(transactions, now, convertAmount)
    default:
      return []
  }
}

function aggregateByHour(transactions: Transaction[], date: Date, convertAmount: ConvertAmount): ChartDataPoint[] {
  // Compare today vs yesterday
  const todayStart = startOfDay(date)
  const todayEnd = endOfDay(date)
  
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayStart = startOfDay(yesterday)
  const yesterdayEnd = endOfDay(yesterday)
  
  const days = [
    { label: 'Yesterday', start: yesterdayStart, end: yesterdayEnd },
    { label: 'Today', start: todayStart, end: todayEnd },
  ]

  return days.map(day => {
    const dayTransactions = transactions.filter(t =>
      t.date >= day.start && t.date <= day.end
    )

    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

    return {
      label: day.label,
      income,
      expense,
      savings: income - expense,
    }
  })
}

function aggregateByWeek(transactions: Transaction[], date: Date, convertAmount: ConvertAmount): ChartDataPoint[] {
  // Get current week (Monday-Sunday)
  const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 }) // 1 = Monday
  const currentWeekEnd = endOfWeek(date, { weekStartsOn: 1 })
  
  // Get previous week
  const prevWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const prevWeekEnd = new Date(currentWeekStart.getTime() - 1)
  
  const weeks = [
    { label: 'Last Week', start: prevWeekStart, end: prevWeekEnd },
    { label: 'This Week', start: currentWeekStart, end: currentWeekEnd },
  ]

  return weeks.map((week) => {
    const weekTransactions = transactions.filter(t =>
      t.date >= week.start && t.date <= week.end
    )

    const income = weekTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

    const expense = weekTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

    return {
      label: week.label,
      income,
      expense,
      savings: income - expense,
    }
  })
}

function aggregateByMonth(transactions: Transaction[], date: Date, convertAmount: ConvertAmount): ChartDataPoint[] {
  // Compare this month vs last month
  const thisMonthStart = startOfMonth(date)
  const thisMonthEnd = endOfMonth(date)
  
  const lastMonthDate = subMonths(date, 1)
  const lastMonthStart = startOfMonth(lastMonthDate)
  const lastMonthEnd = endOfMonth(lastMonthDate)
  
  const months = [
    { label: 'Last Month', start: lastMonthStart, end: lastMonthEnd },
    { label: 'This Month', start: thisMonthStart, end: thisMonthEnd },
  ]

  return months.map(month => {
    const monthTransactions = transactions.filter(t =>
      t.date >= month.start && t.date <= month.end
    )

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

    return {
      label: month.label,
      income,
      expense,
      savings: income - expense,
    }
  })
}

export function calculateDashboardStats(
  transactions: Transaction[],
  period: TimePeriod,
  monthlyIncome: number = 5000,
  convertAmount: ConvertAmount = (a) => a,
  mandatoryExpenses: { amount: number }[] = []
): DashboardStats {
  const now = new Date()
  
  const { start, end } = getDateRange(period, now)
  
  const periodTransactions = transactions.filter(t => 
    t.date >= start && t.date <= end
  )

  const transactionIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

  const totalIncome = transactionIncome
  const daysInMonth = endOfMonth(now).getDate()

  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

  const totalSavings = totalIncome - totalExpenses
  const dailyBudget = calculateDailyBudget(monthlyIncome, mandatoryExpenses)

  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const todayTransactions = transactions.filter(t => 
    t.date >= todayStart && t.date <= todayEnd && t.type === 'expense'
  )
  const spentToday = todayTransactions.reduce((sum, t) => sum + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

  const remainingBudget = Math.max(0, dailyBudget - spentToday)
  const daysRemaining = daysInMonth - now.getDate() + 1

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    dailyBudget,
    remainingBudget,
    spentToday,
    daysRemaining,
  }
}

function getDateRange(period: TimePeriod, date: Date): { start: Date; end: Date } {
  switch (period) {
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      }
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      }
    case 'year':
      return {
        start: startOfMonth(subMonths(date, 11)),
        end: endOfMonth(date),
      }
  }
}

export function calculateGoalProgress(
  transactions: Transaction[],
  monthlyIncome: number,
  savingsGoalPercentage: number = DEFAULT_SAVINGS_GOAL_PERCENTAGE
) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  
  const monthTransactions = transactions.filter(t => 
    t.date >= monthStart && t.date <= monthEnd
  )

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const currentSavings = income - expenses
  const goalAmount = monthlyIncome * (savingsGoalPercentage / 100)
  const remainingToGoal = goalAmount - currentSavings

  const daysInMonth = monthEnd.getDate()
  const daysPassed = now.getDate()
  const expectedSavings = (goalAmount / daysInMonth) * daysPassed
  const isOnTrack = currentSavings >= expectedSavings

  let message = ''
  if (remainingToGoal <= 0) {
    message = '🎉 You hit your savings goal! Amazing work!'
  } else if (remainingToGoal <= SAVINGS_GOAL_THRESHOLD) {
    message = `TRY SAVING $${Math.ceil(remainingToGoal)} MORE THIS WEEK TO HIT YOUR GOAL`
  } else if (isOnTrack) {
    message = `You're on track! Keep saving $${Math.ceil(remainingToGoal / (daysInMonth - daysPassed))} per day`
  } else {
    message = `Save $${Math.ceil(remainingToGoal / (daysInMonth - daysPassed))} daily to reach your goal`
  }

  return {
    goalAmount,
    currentSavings,
    remainingToGoal,
    isOnTrack,
    message,
  }
}

export function getRecentTransactions(
  transactions: Transaction[],
  limit: number = 5
): Transaction[] {
  return transactions
    .filter(t => t.type === 'expense' || t.type === 'income')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
}

export function formatTransactionDate(date: Date): string {
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return format(date, 'h:mm a')
  } else if (diffInDays === 1) {
    return 'YESTERDAY'
  } else if (diffInDays < 7) {
    return format(date, 'EEEE').toUpperCase()
  } else {
    return format(date, 'MMM d').toUpperCase()
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function calculateBudgetRing(
  dailyBudget: number,
  spentToday: number
) {
  const isOverBudget = spentToday > dailyBudget
  // Allow negative remaining to show overspending
  const remaining = dailyBudget - spentToday
  // Calculate percentage - cap at 100% for ring display when over budget
  const rawPercentage = dailyBudget > 0 ? (spentToday / dailyBudget) * 100 : 0
  const percentage = isOverBudget ? 100 : Math.min(rawPercentage, 100)

  return {
    percentage,
    remaining,
    spent: spentToday,
    isOverBudget,
  }
}