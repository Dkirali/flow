export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  note?: string
  date: string
  time: string
  isMandatory: boolean
  isLeisure: boolean
  isRecurring: boolean
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly'
  recurringDay?: number
  currencyCode: string
  createdAt: string
}

export interface NewTransaction {
  amount: number
  type: 'income' | 'expense'
  category: string
  note?: string
  date: string
  time: string
  isMandatory?: boolean
  isLeisure?: boolean
  isRecurring?: boolean
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly'
  recurringDay?: number
  currencyCode?: string
}

export interface IncomeSource {
  id: string
  name: string
  amount: number
  category: string
  isRecurring: boolean
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly'
  recurringDay?: number
  currencyCode: string
  createdAt: string
}

export interface NewIncomeSource {
  name: string
  amount: number
  category: string
  isRecurring?: boolean
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly'
  recurringDay?: number
  currencyCode?: string
}

export interface MandatoryExpense {
  id: string
  name: string
  amount: number
  category: string
  isRecurring: boolean
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly'
  recurringDay?: number
  createdAt: string
}

export interface NewMandatoryExpense {
  name: string
  amount: number
  category: string
  isRecurring?: boolean
  recurringFrequency?: 'monthly' | 'weekly' | 'biweekly'
  recurringDay?: number
}
