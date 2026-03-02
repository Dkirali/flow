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

// Types
export type TimePeriod = 'day' | 'month' | 'year'

export interface Transaction {
  id: string
  amount: number
  category: string
  description: string
  date: Date
  type: 'income' | 'expense'
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
  period: TimePeriod
): ChartDataPoint[] {
  const now = new Date()

  switch (period) {
    case 'day':
      return aggregateByHour(transactions, now)
    case 'month':
      return aggregateByWeek(transactions, now)
    case 'year':
      return aggregateByMonth(transactions, now)
    default:
      return []
  }
}

function aggregateByHour(transactions: Transaction[], date: Date): ChartDataPoint[] {
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)
  
  const timeBlocks = [
    { label: '12-4AM', start: 0, end: 4 },
    { label: '4-8AM', start: 4, end: 8 },
    { label: '8-12PM', start: 8, end: 12 },
    { label: '12-4PM', start: 12, end: 16 },
    { label: '4-8PM', start: 16, end: 20 },
    { label: '8-12AM', start: 20, end: 24 },
  ]

  return timeBlocks.map(block => {
    const blockTransactions = transactions.filter(t => {
      const hour = t.date.getHours()
      return t.date >= dayStart && t.date <= dayEnd && hour >= block.start && hour < block.end
    })

    const income = blockTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = blockTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      label: block.label,
      income,
      expense,
      savings: income - expense,
    }
  })
}

function aggregateByWeek(transactions: Transaction[], date: Date): ChartDataPoint[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  
  const weeks: Date[] = []
  let currentWeek = startOfWeek(monthStart, { weekStartsOn: 1 })
  
  while (currentWeek <= monthEnd) {
    weeks.push(currentWeek)
    currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  return weeks.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    
    const weekTransactions = transactions.filter(t => 
      t.date >= weekStart && t.date <= weekEnd
    )

    const income = weekTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = weekTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      label: `W${index + 1}`,
      income,
      expense,
      savings: income - expense,
    }
  })
}

function aggregateByMonth(transactions: Transaction[], date: Date): ChartDataPoint[] {
  const months: Date[] = []
  
  for (let i = 11; i >= 0; i--) {
    months.push(subMonths(date, i))
  }

  return months.map(monthDate => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    
    const monthTransactions = transactions.filter(t => 
      t.date >= monthStart && t.date <= monthEnd
    )

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      label: format(monthDate, 'MMM'),
      income,
      expense,
      savings: income - expense,
    }
  })
}

export function calculateDashboardStats(
  transactions: Transaction[],
  period: TimePeriod,
  monthlyIncome: number = 5000
): DashboardStats {
  const now = new Date()
  
  const { start, end } = getDateRange(period, now)
  
  const periodTransactions = transactions.filter(t => 
    t.date >= start && t.date <= end
  )

  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSavings = totalIncome - totalExpenses

  const daysInMonth = endOfMonth(now).getDate()
  const dailyBudget = monthlyIncome / daysInMonth

  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const todayTransactions = transactions.filter(t => 
    t.date >= todayStart && t.date <= todayEnd && t.type === 'expense'
  )
  const spentToday = todayTransactions.reduce((sum, t) => sum + t.amount, 0)

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
  savingsGoalPercentage: number = 20
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
  } else if (remainingToGoal <= 10) {
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
    .filter(t => t.type === 'expense')
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
  const spent = Math.min(spentToday, dailyBudget)
  const remaining = Math.max(0, dailyBudget - spentToday)
  const percentage = dailyBudget > 0 ? (spent / dailyBudget) * 100 : 0
  const isOverBudget = spentToday > dailyBudget

  return {
    percentage: Math.min(percentage, 100),
    remaining,
    spent: spentToday,
    isOverBudget,
  }
}