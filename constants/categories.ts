import { 
  UtensilsCrossed, 
  Car, 
  Home, 
  Film, 
  ShoppingBag, 
  Heart, 
  BookOpen, 
  Gift, 
  FileText, 
  Plane, 
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Store,
  Wallet
} from 'lucide-react-native'

export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  icon: string
  type: TransactionType
  color: string
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'UtensilsCrossed', type: 'expense', color: '#FF6B6B' },
  { id: 'transport', name: 'Transportation', icon: 'Car', type: 'expense', color: '#4CC9F0' },
  { id: 'housing', name: 'Housing', icon: 'Home', type: 'expense', color: '#9B5DE5' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', type: 'expense', color: '#F15BB5' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', type: 'expense', color: '#00BBF9' },
  { id: 'health', name: 'Health', icon: 'Heart', type: 'expense', color: '#00F5D4' },
  { id: 'education', name: 'Education', icon: 'BookOpen', type: 'expense', color: '#FEE440' },
  { id: 'gifts', name: 'Gifts & Donations', icon: 'Gift', type: 'expense', color: '#FF99C8' },
  { id: 'bills', name: 'Bills & Fees', icon: 'FileText', type: 'expense', color: '#CDB4DB' },
  { id: 'travel', name: 'Travel', icon: 'Plane', type: 'expense', color: '#A2D2FF' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal', type: 'expense', color: '#B8B8D1' },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: 'Briefcase', type: 'income', color: '#00C9A7' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop', type: 'income', color: '#6C63FF' },
  { id: 'investments', name: 'Investments', icon: 'TrendingUp', type: 'income', color: '#FFD93D' },
  { id: 'business', name: 'Business', icon: 'Store', type: 'income', color: '#FF6B6B' },
  { id: 'gifts', name: 'Gifts', icon: 'Gift', type: 'income', color: '#9B5DE5' },
  { id: 'other-income', name: 'Other Income', icon: 'Wallet', type: 'income', color: '#4CC9F0' },
]

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find(cat => cat.id === id)
}

export function getCategoriesByType(type: TransactionType): Category[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

// Keep existing exports for backward compatibility
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
export type CategoryLegacy = IncomeCategory | MandatoryCategory | LeisureCategory
