import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import * as schema from './schema'

const expoDb = openDatabaseSync('flow.db', {
  enableChangeListener: true,
})

export const db = drizzle(expoDb, { schema })

export async function runMigrations() {
  try {
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        is_mandatory INTEGER DEFAULT 0,
        is_leisure INTEGER DEFAULT 0,
        is_recurring INTEGER DEFAULT 0,
        recurring_frequency TEXT,
        recurring_day INTEGER,
        currency_code TEXT DEFAULT 'USD',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS income_sources (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 1,
        recurring_frequency TEXT,
        recurring_day INTEGER,
        currency_code TEXT DEFAULT 'USD',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mandatory_expenses (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 1,
        recurring_day INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `)
    console.log('[Database] Tables ready')
  } catch (error) {
    console.error('[Database] Setup failed:', error)
    throw error
  }
}