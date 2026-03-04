import { View, Text, Pressable, ScrollView, SafeAreaView, ActivityIndicator, useColorScheme, Alert } from 'react-native'
import { useState, useMemo, useEffect, useRef } from 'react'
import { router } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import {
  aggregateTransactionsByPeriod,
  calculateDashboardStats,
  calculateGoalProgress,
  getRecentTransactions,
  formatTransactionDate,
  getGreeting,
  calculateBudgetRing,
  type TimePeriod,
  type Transaction as DashboardTransaction,
} from '@/utils/dashboardLogic'
import ProgressRing from '@/components/ui/ProgressRing'
import DraggableFAB from '@/components/ui/DraggableFAB'
import HorizontalBarChart from '@/components/ui/HorizontalBarChart'
import { SwipeableTransactionItem } from '@/components/ui/SwipeableTransactionItem'
import { AddTransactionModal } from '@/components/ui/AddTransactionModal'

// ─── Icons ───────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="#EEEEFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#EEEEFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  )
}

function TrendingUpIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke="#00C9A7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M17 6h6v6" stroke="#00C9A7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

function TrendingDownIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M23 18l-9.5-9.5-5 5L1 6" stroke="#FF6B6B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M17 18h6v-6" stroke="#FF6B6B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'day':   return 'Today vs Yesterday'
    case 'month': return 'This Week vs Last Week'
    case 'year':  return 'This Month vs Last Month'
  }
}

// ─── Category icon helper ─────────────────────────────────────────────────────

function CategoryIcon({ category, isDark }: { category: string; isDark: boolean }) {
  const lower = category.toLowerCase()
  let icon = '💳'
  if (lower.includes('food') || lower.includes('drink') || lower.includes('coffee') || lower.includes('dining') || lower.includes('grocer')) icon = '🍔'
  else if (lower.includes('transport') || lower.includes('uber') || lower.includes('lyft')) icon = '🚗'
  else if (lower.includes('shopping') || lower.includes('retail')) icon = '🛍️'
  else if (lower.includes('entertainment') || lower.includes('movie')) icon = '🎬'
  else if (lower.includes('health') || lower.includes('gym')) icon = '💊'
  else if (lower.includes('rent') || lower.includes('housing') || lower.includes('mortgage')) icon = '🏠'
  else if (lower.includes('salary') || lower.includes('income')) icon = '💰'
  else if (lower.includes('freelance')) icon = '💻'
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? '#2E2D45' : '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyActivity({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
      {/* Glowing icon */}
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#6C63FF20',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      }}>
        <Text style={{ fontSize: 36 }}>💳</Text>
      </View>
      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
        No transactions yet
      </Text>
      <Text style={{ color: '#8888AA', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
        Tap the + button to add your first{'\n'}income or expense entry.
      </Text>
      <Pressable
        onPress={onAdd}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: '#6C63FF',
          borderRadius: 24, paddingHorizontal: 24, paddingVertical: 14,
          shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>+</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Add First Transaction</Text>
      </Pressable>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const periods: { id: TimePeriod; label: string }[] = [
  { id: 'day',   label: 'Day' },
  { id: 'month', label: 'Month' },
  { id: 'year',  label: 'Year' },
]

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month')
  const [showChartOptions, setShowChartOptions] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editTransaction, setEditTransaction] = useState<DashboardTransaction | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const isMounted = useRef(true)

  const { name } = useUserStore()
  const { theme, accentColor, currencySymbol } = useSettingsStore()
  const { incomeSources, mandatoryExpenses, monthlyIncome } = useBudgetStore()
  const { transactions: storeTransactions, deleteTransaction, updateTransaction } = useTransactionStore()
  const { convertToBase } = useExchangeRates()
  const systemScheme = useColorScheme()

  const effectiveTheme = theme === 'system' ? (systemScheme ?? 'dark') : theme
  const isDark = effectiveTheme === 'dark'

  const colors = {
    bg: isDark ? '#0F0E1A' : '#F8F9FA',
    card: isDark ? '#1A1928' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A2E',
    subtext: isDark ? '#8888AA' : '#6B7280',
    divider: isDark ? '#2E2D45' : '#E5E7EB',
    accent: accentColor,
  }

  const greeting = getGreeting()
  const userName = name || 'Alex'

  // Wait for settings store to rehydrate from AsyncStorage
  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setIsHydrated(true)
      return () => { isMounted.current = false }
    }
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      if (isMounted.current) setIsHydrated(true)
    })
    return () => {
      isMounted.current = false
      unsub()
    }
  }, [])

  // Convert store transactions (string dates) → dashboard Transaction type (Date objects)
  const transactions = useMemo<DashboardTransaction[]>(() =>
    storeTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      category: t.category,
      description: t.note ?? t.category,
      date: new Date(`${t.date}T${t.time}:00`),
      type: t.type,
      currencyCode: t.currencyCode ?? 'USD',
      isMandatory: t.isMandatory,
      isLeisure: t.isLeisure,
      isRecurring: t.isRecurring,
    })),
    [storeTransactions]
  )

  const hasTransactions = transactions.length > 0

  const chartData       = useMemo(() => aggregateTransactionsByPeriod(transactions, selectedPeriod, convertToBase), [transactions, selectedPeriod, convertToBase])
  const stats           = useMemo(() => calculateDashboardStats(transactions, selectedPeriod, monthlyIncome, convertToBase, mandatoryExpenses), [transactions, selectedPeriod, monthlyIncome, convertToBase, mandatoryExpenses])
  const goalProgress    = useMemo(() => calculateGoalProgress(transactions, monthlyIncome, 20), [transactions, monthlyIncome])
  const recentTxns      = useMemo(() => getRecentTransactions(transactions, 5), [transactions])
  const budgetRing      = useMemo(() => calculateBudgetRing(stats.dailyBudget, stats.spentToday), [stats])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ color: colors.subtext, fontSize: 12, letterSpacing: 1 }}>WELCOME BACK</Text>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{greeting}, {userName}</Text>
              </View>
            </View>
            <Pressable style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
              <BellIcon />
            </Pressable>
          </View>

          {/* Time Period Selector */}
          <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: 28, padding: 4, marginBottom: 16 }}>
            {periods.map(period => (
              <Pressable
                key={period.id}
                onPress={() => setSelectedPeriod(period.id)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 24, alignItems: 'center',
                  backgroundColor: selectedPeriod === period.id ? colors.accent : 'transparent',
                }}
              >
                <Text style={{ color: selectedPeriod === period.id ? '#FFFFFF' : colors.subtext, fontWeight: '600', fontSize: 14 }}>
                  {period.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Goal Banner */}
          {goalProgress.remainingToGoal > 0 && goalProgress.remainingToGoal <= 50 && (
            <View style={{ backgroundColor: colors.accent, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>✨</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1, letterSpacing: 0.5 }}>
                {goalProgress.message}
              </Text>
            </View>
          )}

          {/* Financial Overview Card */}
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Financial Overview</Text>
                <Text style={{ color: colors.subtext, fontSize: 13 }}>Income vs Expenses vs Savings</Text>
              </View>
              <Pressable onPress={() => setShowChartOptions(true)}>
                <Text style={{ color: colors.subtext, fontSize: 20 }}>⋯</Text>
              </Pressable>
            </View>

            {!isHydrated ? (
              <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.accent} />
                <Text style={{ color: colors.subtext, fontSize: 12, marginTop: 8 }}>Loading your data...</Text>
              </View>
            ) : (
              <HorizontalBarChart
                data={chartData}
                period={selectedPeriod}
                title={getPeriodLabel(selectedPeriod)}
                isDark={isDark}
              />
            )}
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
              <TrendingUpIcon />
              <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }}>TOTAL INCOME</Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
                {currencySymbol}{stats.totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
              <TrendingDownIcon />
              <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }}>TOTAL EXPENSES</Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
                {currencySymbol}{stats.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          {/* Daily Budget Ring */}
          <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.subtext, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 20 }}>DAILY BUDGET RING</Text>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing
                  percentage={budgetRing.percentage}
                  size={180}
                  strokeWidth={12}
                  color={budgetRing.isOverBudget ? '#FF6B6B' : '#00C9A7'}
                />
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Text style={{ color: budgetRing.isOverBudget ? '#FF6B6B' : colors.text, fontSize: 32, fontWeight: '700' }}>
                    {budgetRing.isOverBudget ? '-' : ''}{currencySymbol}{Math.abs(budgetRing.remaining).toFixed(2)}
                  </Text>
                  <Text style={{ color: budgetRing.isOverBudget ? '#FF6B6B' : colors.subtext, fontSize: 12, fontWeight: '600' }}>
                    {budgetRing.isOverBudget ? 'OVER BUDGET' : 'REMAINING'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: '#FF6B6B', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
                  {currencySymbol}{budgetRing.spent.toFixed(2)}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: '600' }}>SPENT TODAY</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
                  {stats.daysRemaining}
                </Text>
                <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: '600' }}>DAYS REMAINING</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Recent Activity</Text>
              {hasTransactions && (
                <Pressable onPress={() => router.push('/(tabs)/calendar')}>
                  <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>VIEW ALL</Text>
                </Pressable>
              )}
            </View>

            {hasTransactions ? (
              recentTxns.map((t) => (
                <SwipeableTransactionItem
                  key={t.id}
                  transaction={t}
                  isDark={isDark}
                  onEdit={(transaction) => {
                    setEditTransaction(transaction)
                    setShowTransactionModal(true)
                  }}
                  onDelete={(transaction) => {
                    deleteTransaction(transaction.id)
                  }}
                />
              ))
            ) : (
              <View style={{ backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden' }}>
                <EmptyActivity onAdd={() => {
                    setEditTransaction(null)
                    setShowTransactionModal(true)
                  }} />
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Chart Options Menu */}
      {showChartOptions && (
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowChartOptions(false)}
        >
          <View style={{
            position: 'absolute', top: 200, right: 24,
            backgroundColor: colors.card, borderRadius: 16, padding: 8, minWidth: 180,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
          }}>
            {[
              { label: 'Export Data',       icon: '📊', action: () => Alert.alert('Coming Soon', 'CSV export will be available in a future update.') },
              { label: 'View Breakdown',    icon: '📈', action: () => router.push('/(tabs)/calendar') },
              { label: 'Filter Categories', icon: '🏷️', action: () => Alert.alert('Coming Soon', 'Category filtering will be available in a future update.') },
            ].map((option, index) => (
              <Pressable
                key={option.label}
                style={{
                  flexDirection: 'row', alignItems: 'center', padding: 12,
                  borderBottomWidth: index !== 2 ? 1 : 0,
                  borderBottomColor: colors.divider,
                }}
                onPress={() => { setShowChartOptions(false); option.action() }}
              >
                <Text style={{ fontSize: 18, marginRight: 12 }}>{option.icon}</Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}

      {/* Draggable FAB */}
      <DraggableFAB onPress={() => {
        setEditTransaction(null)
        setShowTransactionModal(true)
      }} />

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        visible={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false)
          setEditTransaction(null)
        }}
        editTransaction={editTransaction as any || undefined}
      />

    </SafeAreaView>
  )
}
