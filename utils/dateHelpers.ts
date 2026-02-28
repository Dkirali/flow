import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth, eachDayOfInterval, getDate, getMonth, getYear, addMonths, subMonths } from 'date-fns'

export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export const formatTime = (time: string, formatStr: string = 'h:mm a'): string => {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  return format(date, formatStr)
}

export const getRelativeDateLabel = (date: string): string => {
  const d = parseISO(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export const getMonthDays = (year: number, month: number): Date[] => {
  const start = startOfMonth(new Date(year, month))
  const end = endOfMonth(new Date(year, month))
  return eachDayOfInterval({ start, end })
}

export const getCurrentMonthKey = (): string => {
  const now = new Date()
  return `${getYear(now)}-${String(getMonth(now) + 1).padStart(2, '0')}`
}

export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd')
}

export const getCurrentTimeString = (): string => {
  return format(new Date(), 'HH:mm')
}

export { 
  parseISO, 
  isToday, 
  isYesterday, 
  startOfMonth, 
  endOfMonth, 
  getDate, 
  getMonth, 
  getYear,
  addMonths,
  subMonths,
}
