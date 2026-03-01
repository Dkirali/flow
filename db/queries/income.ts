import { generateId } from '@/utils/generateId'
import { db } from '@/db/client'
import { incomeSources } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { IncomeSource, NewIncomeSource } from '@/types/transaction'

/**
 * Get all income sources from the database
 */
export async function getAllIncomeSources(): Promise<IncomeSource[]> {
  const results = await db.select().from(incomeSources)
  return results as IncomeSource[]
}

/**
 * Insert a new income source
 */
export async function insertIncomeSource(source: NewIncomeSource): Promise<void> {
  const id = generateId()
  const now = new Date().toISOString()
  
  await db.insert(incomeSources).values({
    ...source,
    id,
    createdAt: now,
    isRecurring: source.isRecurring ?? true,
    currencyCode: source.currencyCode ?? 'USD',
  })
}

/**
 * Update an existing income source
 */
export async function updateIncomeSource(
  id: string,
  data: Partial<IncomeSource>
): Promise<void> {
  await db
    .update(incomeSources)
    .set(data)
    .where(eq(incomeSources.id, id))
}

/**
 * Delete an income source
 */
export async function deleteIncomeSource(id: string): Promise<void> {
  await db.delete(incomeSources).where(eq(incomeSources.id, id))
}
