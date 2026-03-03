import type { Transaction } from '@/types/transaction'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayDots {
  hasIncome: boolean
  hasExpense: boolean
}

export interface MonthSummary {
  totalIncome: number
  totalExpenses: number
  savings: number
}

export interface DayStats {
  spent: number
  remaining: number
  /** 0–100, capped at 100 */
  budgetPercentage: number
}

/** dateString ("YYYY-MM-DD") → activity dots */
export type DotMap = Record<string, DayDots>

// ─── Calendar grid ────────────────────────────────────────────────────────────

/**
 * Builds a 2D grid of weeks × 7 day slots.
 * null slots represent empty padding cells before the 1st and after the last.
 */
export function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday
  const totalDays = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  // Pad to a full last row
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

// ─── Date string helpers ──────────────────────────────────────────────────────

/** "YYYY-MM-DD" for a calendar day */
export function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** "September 2023" */
export function formatMonthHeader(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

/** "Sept 15, 2023" */
export function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Navigate a month forward or backward, handles year rollover */
export function navigateMonth(
  year: number,
  month: number,
  direction: 1 | -1
): { year: number; month: number } {
  let newMonth = month + direction
  let newYear = year
  if (newMonth > 11) { newMonth = 0; newYear++ }
  if (newMonth < 0)  { newMonth = 11; newYear-- }
  return { year: newYear, month: newMonth }
}

// ─── Data derivation ──────────────────────────────────────────────────────────

/**
 * Builds a map of dateString → income/expense dot flags for an entire month.
 * Only iterates transactions that fall in the given year+month.
 */
export function buildDotMap(
  transactions: Transaction[],
  year: number,
  month: number
): DotMap {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const map: DotMap = {}

  for (const t of transactions) {
    if (!t.date.startsWith(prefix)) continue
    const key = t.date.slice(0, 10)
    if (!map[key]) map[key] = { hasIncome: false, hasExpense: false }
    if (t.type === 'income')  map[key].hasIncome = true
    if (t.type === 'expense') map[key].hasExpense = true
  }

  return map
}

/**
 * Month-level income / expense / savings summary.
 * Uses convertAmount for multi-currency support.
 */
export function getMonthSummary(
  transactions: Transaction[],
  year: number,
  month: number,
  convertAmount: (amount: number, code: string) => number = (a) => a
): MonthSummary {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthTxns = transactions.filter(t => t.date.startsWith(prefix))

  const totalIncome = monthTxns
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

  const totalExpenses = monthTxns
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

  return { totalIncome, totalExpenses, savings: totalIncome - totalExpenses }
}

/**
 * Per-day stats for the detail panel.
 * remaining is capped at 0 (cannot be negative here — overspend shown separately).
 */
export function getDayStats(
  transactions: Transaction[],
  dateStr: string,
  dailyBudget: number,
  convertAmount: (amount: number, code: string) => number = (a) => a
): DayStats {
  const spent = transactions
    .filter(t => t.date === dateStr && t.type === 'expense')
    .reduce((s, t) => s + convertAmount(t.amount, t.currencyCode ?? 'USD'), 0)

  const remaining = Math.max(0, dailyBudget - spent)
  const budgetPercentage =
    dailyBudget > 0 ? Math.min(100, Math.round((spent / dailyBudget) * 100)) : 0

  return { spent, remaining, budgetPercentage }
}

/**
 * Returns all transactions for a specific date, sorted newest-first by time.
 */
export function getTransactionsForDate(
  transactions: Transaction[],
  dateStr: string
): Transaction[] {
  return transactions
    .filter(t => t.date === dateStr)
    .sort((a, b) => b.time.localeCompare(a.time))
}
