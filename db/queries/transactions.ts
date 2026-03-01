import { generateId } from '@/utils/generateId'
import { db } from '@/db/client'
import { transactions } from '@/db/schema'
import { eq, and, like } from 'drizzle-orm'
import type { Transaction, NewTransaction } from '@/types/transaction'

/**
 * Get all transactions from the database
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const results = await db.select().from(transactions)
  return results as Transaction[]
}

/**
 * Get transactions for a specific date
 */
export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  const results = await db
    .select()
    .from(transactions)
    .where(eq(transactions.date, date))
  return results as Transaction[]
}

/**
 * Get transactions for a specific month
 */
export async function getTransactionsByMonth(
  year: number,
  month: number
): Promise<Transaction[]> {
  const monthStr = String(month + 1).padStart(2, '0')
  const yearStr = String(year)
  const prefix = `${yearStr}-${monthStr}`
  
  const results = await db
    .select()
    .from(transactions)
    .where(like(transactions.date, `${prefix}%`))
  return results as Transaction[]
}

/**
 * Get today's transactions
 */
export async function getTodayTransactions(): Promise<Transaction[]> {
  const today = new Date().toISOString().split('T')[0]
  return getTransactionsByDate(today)
}

/**
 * Insert a new transaction
 */
export async function insertTransaction(t: NewTransaction): Promise<void> {
  const id = generateId()
  const now = new Date().toISOString()
  
  await db.insert(transactions).values({
    ...t,
    id,
    createdAt: now,
    isMandatory: t.isMandatory ?? false,
    isLeisure: t.isLeisure ?? false,
    isRecurring: t.isRecurring ?? false,
    currencyCode: t.currencyCode ?? 'USD',
  })
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  id: string,
  t: Partial<Transaction>
): Promise<void> {
  await db
    .update(transactions)
    .set(t)
    .where(eq(transactions.id, id))
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id))
}
