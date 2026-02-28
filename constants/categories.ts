export const incomeCategories = [
  { id: 'salary', name: 'Salary', icon: 'Wallet' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop' },
  { id: 'business', name: 'Business Revenue', icon: 'Building2' },
  { id: 'investment', name: 'Investment Returns', icon: 'TrendingUp' },
  { id: 'gift', name: 'Gift / Bonus', icon: 'Gift' },
  { id: 'other', name: 'Other', icon: 'CircleDollarSign' },
] as const

export const mandatoryExpenseCategories = [
  { id: 'rent', name: 'Rent / Mortgage', icon: 'Home' },
  { id: 'utilities', name: 'Utilities', icon: 'Zap' },
  { id: 'phone', name: 'Phone & Internet', icon: 'Smartphone' },
  { id: 'insurance', name: 'Insurance', icon: 'Shield' },
  { id: 'groceries', name: 'Groceries', icon: 'ShoppingCart' },
  { id: 'transport', name: 'Transport', icon: 'Bus' },
  { id: 'loan', name: 'Loan Repayment', icon: 'CreditCard' },
  { id: 'medical', name: 'Medical', icon: 'Heart' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'Repeat' },
  { id: 'other-mandatory', name: 'Other Mandatory', icon: 'CircleDollarSign' },
] as const

export const leisureExpenseCategories = [
  { id: 'dining', name: 'Dining Out', icon: 'Utensils' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag' },
  { id: 'travel', name: 'Travel', icon: 'Plane' },
  { id: 'fitness', name: 'Fitness', icon: 'Dumbbell' },
  { id: 'hobbies', name: 'Hobbies', icon: 'Palette' },
  { id: 'gifts', name: 'Gifts', icon: 'Gift' },
  { id: 'personal-care', name: 'Personal Care', icon: 'Sparkles' },
  { id: 'other-leisure', name: 'Other Leisure', icon: 'CircleDollarSign' },
] as const

export const allCategories = {
  income: incomeCategories,
  mandatory: mandatoryExpenseCategories,
  leisure: leisureExpenseCategories,
} as const

export type IncomeCategory = typeof incomeCategories[number]['id']
export type MandatoryCategory = typeof mandatoryExpenseCategories[number]['id']
export type LeisureCategory = typeof leisureExpenseCategories[number]['id']
export type Category = IncomeCategory | MandatoryCategory | LeisureCategory
