import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import { migrate } from 'drizzle-orm/expo-sqlite/migrator'
import * as schema from './schema'
import migrations from './migrations/migrations'

const expoDb = openDatabaseSync('flow.db', {
  enableChangeListener: true,
})

export const db = drizzle(expoDb, { schema })

export type DB = typeof db

// Run migrations on app start
export async function runMigrations() {
  try {
    await migrate(db, migrations)
    console.log('[Database] Migrations completed successfully')
  } catch (error) {
    console.error('[Database] Migration failed:', error)
    throw error
  }
}
