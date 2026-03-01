import { generateId } from '@/utils/generateId'
import { db } from '@/db/client'
import { mandatoryExpenses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { MandatoryExpense, NewMandatoryExpense } from '@/types/transaction'

/**
 * Get all mandatory expenses from the database
 */
export async function getAllMandatoryExpenses(): Promise<MandatoryExpense[]> {
  const results = await db.select().from(mandatoryExpenses)
  return results as MandatoryExpense[]
}

/**
 * Insert a new mandatory expense
 */
export async function insertMandatoryExpense(
  expense: NewMandatoryExpense
): Promise<void> {
  const id = generateId()
  const now = new Date().toISOString()
  
  await db.insert(mandatoryExpenses).values({
    ...expense,
    id,
    createdAt: now,
    isRecurring: expense.isRecurring ?? true,
  })
}

/**
 * Update an existing mandatory expense
 */
export async function updateMandatoryExpense(
  id: string,
  data: Partial<MandatoryExpense>
): Promise<void> {
  await db
    .update(mandatoryExpenses)
    .set(data)
    .where(eq(mandatoryExpenses.id, id))
}

/**
 * Delete a mandatory expense
 */
export async function deleteMandatoryExpense(id: string): Promise<void> {
  await db.delete(mandatoryExpenses).where(eq(mandatoryExpenses.id, id))
}
