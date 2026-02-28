import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import { migrate } from 'drizzle-orm/expo-sqlite/migrator'
import * as schema from './schema'
import migrations from './migrations/migrations'
import { Platform } from 'react-native'

// Mock database for web/Expo Go compatibility
let db: any
let isMockDb = false

if (Platform.OS === 'web') {
  // Web mock - in-memory storage
  console.log('[Database] Using web mock')
  isMockDb = true
  
  // Create mock db with same interface
  const mockData: Record<string, any[]> = {
    transactions: [],
    income_sources: [],
    mandatory_expenses: [],
    settings: [],
  }
  
  db = {
    select: () => ({
      from: (table: any) => ({
        where: () => mockData[table.name] || [],
        all: () => mockData[table.name] || [],
      }),
      all: () => Promise.resolve(mockData.transactions),
    }),
    insert: (table: any) => ({
      values: (data: any) => {
        const tableName = table?.name || 'transactions'
        if (!mockData[tableName]) mockData[tableName] = []
        mockData[tableName].push(data)
        return Promise.resolve()
      },
    }),
    update: (table: any) => ({
      set: (data: any) => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: (table: any) => ({
      where: () => Promise.resolve(),
    }),
  }
} else {
  // Native SQLite
  try {
    const expoDb = openDatabaseSync('flow.db', {
      enableChangeListener: true,
    })
    db = drizzle(expoDb, { schema })
  } catch (error) {
    console.log('[Database] Falling back to mock')
    isMockDb = true
    db = {
      select: () => ({ from: () => ({ all: () => [] }) }),
      insert: () => ({ values: () => Promise.resolve() }),
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      delete: () => ({ where: () => Promise.resolve() }),
    }
  }
}

export { db }
export type DB = typeof db

// Run migrations on app start
export async function runMigrations() {
  if (isMockDb || Platform.OS === 'web') {
    console.log('[Database] Skipping migrations (mock mode)')
    return
  }
  
  try {
    await migrate(db, migrations)
    console.log('[Database] Migrations completed successfully')
  } catch (error) {
    console.error('[Database] Migration failed:', error)
    throw error
  }
}
