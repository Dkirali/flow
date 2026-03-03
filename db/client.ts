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
        recurring_frequency TEXT,
        recurring_day INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `)

    // Additive column migrations — ALTER TABLE throws if column already exists,
    // so each is wrapped individually. These are safe to re-run on every launch.
    const alterStatements = [
      `ALTER TABLE mandatory_expenses ADD COLUMN recurring_frequency TEXT`,
      `ALTER TABLE mandatory_expenses ADD COLUMN recurring_day INTEGER`,
      `ALTER TABLE transactions ADD COLUMN currency_code TEXT DEFAULT 'USD'`,
      `ALTER TABLE income_sources ADD COLUMN currency_code TEXT DEFAULT 'USD'`,
    ]
    for (const sql of alterStatements) {
      try { expoDb.execSync(sql) } catch { /* column already exists */ }
    }
  } catch (error) {
    throw error
  }
}