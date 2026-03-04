import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
} from 'date-fns'
import type { Transaction } from '@/types/transaction'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlySummaryResult {
  monthName: string
  savingsChangePercent: number
  biggestReductionCategory: string
  biggestReductionAmount: number
  streak: number
  totalSaved: number
  totalExpenses: number
}

export interface SpendingPatternPoint {
  label: string
  amount: number
  isToday: boolean
}

export interface InvestmentAlternativeResult {
  category: string
  amount: number
  returns: {
    sp500: number
    bitcoin: number
    gold: number
    realEstate: number
  }
}

export type StreakStatus = 'on' | 'over' | 'none'

export interface StreakDay {
  date: string
  status: StreakStatus
}

export interface SubscriptionItem {
  id: string
  name: string
  amount: number
  category: string
  status: 'active' | 'unused'
}

export interface ForecastPoint {
  month: string
  optimistic: number
  conservative: number
}

export interface AIGoalResult {
  category: string
  goalAmount: number
  progressPercent: number
  currentSpend: number
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

export function getMonthlySummary(
  transactions: Transaction[],
  monthlyIncome: number,
  now = new Date()
): MonthlySummaryResult {
  const thisStart = startOfMonth(now)
  const thisEnd = endOfMonth(now)
  const lastStart = startOfMonth(subMonths(now, 1))
  const lastEnd = endOfMonth(subMonths(now, 1))

  const filter = (start: Date, end: Date) =>
    transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d >= start && d <= end
    })

  const thisTxns = filter(thisStart, thisEnd)
  const lastTxns = filter(lastStart, lastEnd)

  const thisExpenses = thisTxns
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const lastExpenses = lastTxns
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const thisSaved = Math.max(0, monthlyIncome - thisExpenses)
  const lastSaved = Math.max(0, monthlyIncome - lastExpenses)

  const savingsChangePercent =
    lastSaved > 0
      ? Math.round(((thisSaved - lastSaved) / lastSaved) * 100)
      : thisSaved > 0
      ? 100
      : 0

  // Biggest spend reduction category (last month spent more than this month)
  const thisCats: Record<string, number> = {}
  const lastCats: Record<string, number> = {}
  thisTxns.filter(t => t.type === 'expense').forEach(t => {
    thisCats[t.category] = (thisCats[t.category] ?? 0) + t.amount
  })
  lastTxns.filter(t => t.type === 'expense').forEach(t => {
    lastCats[t.category] = (lastCats[t.category] ?? 0) + t.amount
  })

  let biggestReductionCategory = 'Dining'
  let biggestReductionAmount = 0
  for (const cat of Object.keys(lastCats)) {
    const reduction = (lastCats[cat] ?? 0) - (thisCats[cat] ?? 0)
    if (reduction > biggestReductionAmount) {
      biggestReductionAmount = reduction
      biggestReductionCategory = cat
    }
  }

  return {
    monthName: format(now, 'MMMM'),
    savingsChangePercent,
    biggestReductionCategory,
    biggestReductionAmount: Math.round(biggestReductionAmount),
    streak: 0,
    totalSaved: parseFloat(thisSaved.toFixed(2)),
    totalExpenses: parseFloat(thisExpenses.toFixed(2)),
  }
}

// ─── Spending Patterns (avg daily spend by day of week, Mon→Sun) ──────────────

export function getSpendingPatterns(
  transactions: Transaction[],
  now = new Date()
): SpendingPatternPoint[] {
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const expenses = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return t.type === 'expense' && d >= thirtyDaysAgo && d <= now
  })

  // Indexed by JS day-of-week (0=Sun … 6=Sat)
  const totals = [0, 0, 0, 0, 0, 0, 0]
  const counts = [0, 0, 0, 0, 0, 0, 0]
  expenses.forEach(t => {
    const dow = new Date(t.date + 'T00:00:00').getDay()
    totals[dow] += t.amount
    counts[dow]++
  })

  const currentDow = now.getDay()
  // Render Mon → Sun: JS indices [1,2,3,4,5,6,0]
  const order = [1, 2, 3, 4, 5, 6, 0]
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return order.map((dow, i) => ({
    label: labels[i],
    amount: counts[dow] > 0 ? totals[dow] / counts[dow] : 0,
    isToday: dow === currentDow,
  }))
}

// ─── Investment Alternative ───────────────────────────────────────────────────

export function getInvestmentAlternative(
  transactions: Transaction[],
  now = new Date()
): InvestmentAlternativeResult {
  const ms = startOfMonth(now)
  const me = endOfMonth(now)

  const expenses = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return t.type === 'expense' && d >= ms && d <= me
  })

  const catTotals: Record<string, number> = {}
  expenses.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] ?? 0) + t.amount
  })

  let topCat = 'Dining Out'
  let topAmt = 0
  for (const [c, a] of Object.entries(catTotals)) {
    if (a > topAmt) {
      topAmt = a
      topCat = c
    }
  }

  // Use a placeholder amount for demo when there's no data
  const amt = topAmt > 0 ? topAmt : 420

  return {
    category: topCat,
    amount: parseFloat(amt.toFixed(2)),
    returns: {
      // Conservative monthly equivalents: S&P ~0.83%/mo, BTC ~4.17%/mo, Gold ~0.58%/mo, RE ~0.67%/mo
      sp500: parseFloat((amt * 0.0083).toFixed(2)),
      bitcoin: parseFloat((amt * 0.0417).toFixed(2)),
      gold: parseFloat((amt * 0.0058).toFixed(2)),
      realEstate: parseFloat((amt * 0.0067).toFixed(2)),
    },
  }
}

// ─── Savings Streak ───────────────────────────────────────────────────────────

export function getSavingsStreak(
  transactions: Transaction[],
  dailyBudget: number,
  now = new Date()
): { days: StreakDay[]; streak: number } {
  const ms = startOfMonth(now)
  const allDays = eachDayOfInterval({ start: ms, end: now })

  const streakDays: StreakDay[] = allDays.map(day => {
    const ds = format(day, 'yyyy-MM-dd')
    const dayTxns = transactions.filter(
      t => t.date === ds && t.type === 'expense'
    )
    if (dayTxns.length === 0) return { date: ds, status: 'none' as StreakStatus }
    const spent = dayTxns.reduce((s, t) => s + t.amount, 0)
    return {
      date: ds,
      status: (dailyBudget > 0 && spent > dailyBudget)
        ? ('over' as StreakStatus)
        : ('on' as StreakStatus),
    }
  })

  let streak = 0
  for (let i = streakDays.length - 1; i >= 0; i--) {
    if (streakDays[i].status === 'on') streak++
    else if (streakDays[i].status === 'over') break
    // 'none' days don't break or add to streak
  }

  return { days: streakDays, streak }
}

// ─── Subscription Audit ───────────────────────────────────────────────────────

export function getSubscriptions(
  transactions: Transaction[],
  now = new Date()
): SubscriptionItem[] {
  const recurring = transactions.filter(
    t => t.type === 'expense' && t.isRecurring
  )
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  // Most-recent first so we capture the latest transaction per sub
  const sorted = [...recurring].sort((a, b) => b.date.localeCompare(a.date))

  const seen = new Map<string, SubscriptionItem>()
  sorted.forEach(t => {
    const key = (t.note ?? t.category).toLowerCase()
    if (!seen.has(key)) {
      const lastUsed = new Date(t.date + 'T00:00:00')
      seen.set(key, {
        id: t.id,
        name: t.note ?? t.category,
        amount: t.amount,
        category: t.category,
        status: lastUsed >= thirtyDaysAgo ? 'active' : 'unused',
      })
    }
  })

  return Array.from(seen.values()).slice(0, 5)
}

// ─── Savings Forecast (6-month projection) ───────────────────────────────────

export function getSavingsForecast(
  transactions: Transaction[],
  monthlyIncome: number,
  now = new Date()
): { points: ForecastPoint[]; estimatedTotal: number } {
  // Average monthly savings over the last 3 months
  let total = 0
  let count = 0
  for (let i = 1; i <= 3; i++) {
    const m = subMonths(now, i)
    const ms = startOfMonth(m)
    const me = endOfMonth(m)
    const expenses = transactions
      .filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return t.type === 'expense' && d >= ms && d <= me
      })
      .reduce((s, t) => s + t.amount, 0)
    total += Math.max(0, monthlyIncome - expenses)
    count++
  }

  const avg = count > 0 ? total / count : monthlyIncome * 0.2

  const points: ForecastPoint[] = []
  let optCumulative = 0
  let conCumulative = 0

  for (let i = 0; i < 6; i++) {
    const futureMonth = new Date(now.getFullYear(), now.getMonth() + i, 1)
    // Optimistic: avg with 5 % monthly improvement
    optCumulative += avg * Math.pow(1.05, i)
    // Conservative: 70 % of avg, flat
    conCumulative += avg * 0.7

    points.push({
      month: format(futureMonth, 'MMM').toUpperCase(),
      optimistic: parseFloat(optCumulative.toFixed(2)),
      conservative: parseFloat(conCumulative.toFixed(2)),
    })
  }

  return { points, estimatedTotal: parseFloat(optCumulative.toFixed(2)) }
}

// ─── AI Goal ─────────────────────────────────────────────────────────────────

export function getAIGoal(
  transactions: Transaction[],
  monthlyIncome: number,
  now = new Date()
): AIGoalResult {
  const ms = startOfMonth(now)
  const me = endOfMonth(now)
  const lastMs = startOfMonth(subMonths(now, 1))
  const lastMe = endOfMonth(subMonths(now, 1))

  const thisDiscretionary = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return t.type === 'expense' && !t.isMandatory && d >= ms && d <= me
  })

  const catTotals: Record<string, number> = {}
  thisDiscretionary.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] ?? 0) + t.amount
  })

  let topCat = 'Dining Out'
  let topAmt = 0
  for (const [c, a] of Object.entries(catTotals)) {
    if (a > topAmt) {
      topAmt = a
      topCat = c
    }
  }

  const goalAmount = Math.max(Math.round(topAmt * 0.2), 50)

  // How much has the user already reduced this category vs last month?
  const lastCatSpend = transactions
    .filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return t.type === 'expense' && t.category === topCat && d >= lastMs && d <= lastMe
    })
    .reduce((s, t) => s + t.amount, 0)

  const savedSoFar = Math.max(0, lastCatSpend - topAmt)
  const progressPercent =
    goalAmount > 0
      ? Math.min(100, Math.round((savedSoFar / goalAmount) * 100))
      : 0

  return {
    category: topCat,
    goalAmount,
    progressPercent,
    currentSpend: parseFloat(topAmt.toFixed(2)),
  }
}
