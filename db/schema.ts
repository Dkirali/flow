import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  note: text('note'),
  date: text('date').notNull(),
  time: text('time').notNull(),
  isMandatory: integer('is_mandatory', { mode: 'boolean' }).default(false),
  isLeisure: integer('is_leisure', { mode: 'boolean' }).default(false),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringFrequency: text('recurring_frequency'),
  recurringDay: integer('recurring_day'),
  currencyCode: text('currency_code').default('USD'),
  createdAt: text('created_at').notNull(),
})

export const incomeSources = sqliteTable('income_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(true),
  recurringFrequency: text('recurring_frequency'),
  recurringDay: integer('recurring_day'),
  currencyCode: text('currency_code').default('USD'),
  createdAt: text('created_at').notNull(),
})

export const mandatoryExpenses = sqliteTable('mandatory_expenses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(true),
  recurringFrequency: text('recurring_frequency'),
  recurringDay: integer('recurring_day'),
  createdAt: text('created_at').notNull(),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
