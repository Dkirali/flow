import { isToday, getDate } from 'date-fns'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@/utils/generateId'
import { db } from '@/db/client'
import { incomeSources, mandatoryExpenses, transactions } from '@/db/schema'
import type { IncomeSource, MandatoryExpense } from '@/types/transaction'

/**
 * Process recurring transactions and income sources on app launch
 * Auto-creates entries for today if they don't exist yet
 */
export async function processRecurringTransactions() {
  console.log('[RecurringEngine] Processing recurring transactions...')
  
  const today = new Date()
  const dayOfMonth = getDate(today)
  
  try {
    // Check income sources
    const sources = await db.select().from(incomeSources)
    for (const source of sources) {
      if (!source.isRecurring) continue
      if (source.recurringDay !== dayOfMonth) continue
      
      const alreadyExists = await checkTodayTransactionExists(source.id, 'income')
      if (!alreadyExists) {
        await createTransactionFromSource(source)
        console.log(`[RecurringEngine] Created income transaction for: ${source.name}`)
      }
    }

    // Check mandatory expenses
    const expenses = await db.select().from(mandatoryExpenses)
    for (const expense of expenses) {
      if (!expense.isRecurring) continue
      if (expense.recurringDay !== dayOfMonth) continue
      
      const alreadyExists = await checkTodayTransactionExists(expense.id, 'expense')
      if (!alreadyExists) {
        await createTransactionFromExpense(expense)
        console.log(`[RecurringEngine] Created expense transaction for: ${expense.name}`)
      }
    }
    
    console.log('[RecurringEngine] Processing complete')
  } catch (error) {
    console.error('[RecurringEngine] Error processing recurring transactions:', error)
  }
}

async function checkTodayTransactionExists(
  sourceId: string,
  type: 'income' | 'expense'
): Promise<boolean> {
  const today = new Date()
    .toISOString()
    .split('T')[0]

  try {
    const result = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.date, today),
          eq(transactions.type, type),
          eq(transactions.isRecurring, true)
        )
      )

    return result.length > 0
  } catch (error) {
    console.error(
      '[RecurringEngine] Error checking today transactions:',
      error
    )
    return false
  }
}

async function createTransactionFromSource(source: IncomeSource) {
  const now = new Date()
  const date = now.toISOString().split('T')[0] // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5) // HH:MM
  
  const transaction = {
    id: generateId(),
    amount: source.amount,
    type: 'income' as const,
    category: source.category,
    note: source.name, // Use source name as note
    date,
    time,
    isMandatory: false,
    isLeisure: false,
    isRecurring: true,
    recurringFrequency: source.recurringFrequency,
    recurringDay: source.recurringDay,
    currencyCode: source.currencyCode,
    createdAt: now.toISOString(),
  }
  
  await db.insert(transactions).values(transaction)
}

async function createTransactionFromExpense(expense: MandatoryExpense) {
  const now = new Date()
  const date = now.toISOString().split('T')[0] // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5) // HH:MM
  
  const transaction = {
    id: generateId(),
    amount: expense.amount,
    type: 'expense' as const,
    category: expense.category,
    note: expense.name, // Use expense name as note
    date,
    time,
    isMandatory: true,
    isLeisure: false,
    isRecurring: true,
    recurringFrequency: expense.recurringFrequency,
    recurringDay: expense.recurringDay,
    currencyCode: 'USD', // Default, should come from settings
    createdAt: now.toISOString(),
  }
  
  await db.insert(transactions).values(transaction)
}
