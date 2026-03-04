import { Platform } from 'react-native'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import * as schema from './schema'

// ── Web no-op proxy ───────────────────────────────────────────────────────────
// expo-sqlite's openDatabaseSync is not available in a browser.
// When running `expo start --web` every db call resolves to [] so screens
// can render without crashing. Native code paths are completely unaffected.
function makeNoopProxy(): any {
  const resolved = Promise.resolve([])
  return new Proxy(resolved, {
    get(target: any, prop: string) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return target[prop].bind(target)
      }
      return (..._args: any[]) => makeNoopProxy()
    },
  })
}

// ── Conditionally initialise SQLite (native) or no-op (web) ──────────────────
let _db: any
let _expoDb: { execSync: (sql: string) => void } | null = null

if (Platform.OS !== 'web') {
  // Dynamic require keeps the expo-sqlite import out of the Metro web bundle
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { openDatabaseSync } = require('expo-sqlite')
  const expoDb = openDatabaseSync('flow.db', { enableChangeListener: true })
  _expoDb = expoDb
  _db = drizzle(expoDb, { schema })
} else {
  _db = makeNoopProxy()
}

export const db: ReturnType<typeof drizzle> = _db

export async function runMigrations() {
  // SQLite is not available in the browser — skip silently
  if (Platform.OS === 'web' || !_expoDb) return

  try {
    _expoDb.execSync(`
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
      try { _expoDb.execSync(sql) } catch { /* column already exists */ }
    }
  } catch (error) {
    throw error
  }
}
