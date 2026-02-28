import { getDaysInMonth } from 'date-fns'

export function calculateDailyBudget(
  monthlyIncome: number,
  mandatoryExpenses: { amount: number }[],
  referenceDate: Date = new Date()
): number {
  const totalMandatory = mandatoryExpenses.reduce(
    (sum, expense) => sum + expense.amount, 0
  )
  const disposableIncome = monthlyIncome - totalMandatory
  const daysInMonth = getDaysInMonth(referenceDate)
  return Math.max(0, disposableIncome / daysInMonth)
}

export function calculateRemainingToday(
  dailyBudget: number,
  todayExpenses: { amount: number; type: string }[]
): number {
  const totalSpent = todayExpenses
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  return dailyBudget - totalSpent
}

export function getRemainingPercentage(
  remaining: number,
  dailyBudget: number
): number {
  if (dailyBudget === 0) return 0
  return Math.max(0, Math.min(100, (remaining / dailyBudget) * 100))
}

export function getRingColor(remainingPercentage: number): string {
  if (remainingPercentage > 50) return '#00C9A7'
  if (remainingPercentage > 25) return '#FFA94D'
  return '#FF6B6B'
}
