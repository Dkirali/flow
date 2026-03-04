import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
} from 'react-native'
import { useState, useMemo, useEffect } from 'react'
import Svg, { Path, Circle } from 'react-native-svg'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { getTodayString } from '@/utils/dateHelpers'
import {
  buildMonthGrid,
  buildDotMap,
  getMonthSummary,
  getDayStats,
  getTransactionsForDate,
  formatMonthHeader,
  formatDayLabel,
  navigateMonth,
} from '@/utils/calendarLogic'
import { CalendarGrid } from '@/components/ui/CalendarGrid'
import type { Transaction } from '@/types/transaction'

// ─── Animated budget ring ─────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const RING_SIZE = 48
const RING_STROKE = 4
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function BudgetRing({ percentage }: { percentage: number }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    })
  }, [percentage])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value),
  }))

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="#6C63FF"
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
          {percentage}%
        </Text>
      </View>
    </View>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#EEEEFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#EEEEFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function ChevronLeft({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Category emoji helper ────────────────────────────────────────────────────

function categoryEmoji(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes('food') || lower.includes('drink') || lower.includes('coffee') || lower.includes('dining') || lower.includes('grocer')) return '🍔'
  if (lower.includes('transport') || lower.includes('uber') || lower.includes('lyft') || lower.includes('metro') || lower.includes('transit')) return '🚗'
  if (lower.includes('shopping') || lower.includes('retail')) return '🛍️'
  if (lower.includes('entertainment') || lower.includes('movie')) return '🎬'
  if (lower.includes('health') || lower.includes('gym')) return '💊'
  if (lower.includes('rent') || lower.includes('housing') || lower.includes('mortgage')) return '🏠'
  if (lower.includes('salary') || lower.includes('income')) return '💰'
  if (lower.includes('freelance')) return '💻'
  return '💳'
}

// ─── Transaction row (non-swipeable) ─────────────────────────────────────────

function DayTransactionRow({
  transaction,
  currencySymbol,
  isDark,
}: {
  transaction: Transaction
  currencySymbol: string
  isDark: boolean
}) {
  const isIncome = transaction.type === 'income'
  return (
    <View
      style={[
        styles.txnRow,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={[styles.txnIcon, { backgroundColor: isDark ? '#2E2D45' : '#E5E7EB' }]}>
        <Text style={{ fontSize: 18 }}>{categoryEmoji(transaction.category)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: isDark ? '#EEEEFF' : '#1A1A2E', fontSize: 14, fontWeight: '600' }}
          numberOfLines={1}
        >
          {transaction.note || transaction.category}
        </Text>
        <Text style={{ color: isDark ? '#555570' : '#9999AA', fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginTop: 1 }}>
          {transaction.category.toUpperCase()}
        </Text>
      </View>
      <Text style={{ color: isIncome ? '#00C9A7' : isDark ? '#EEEEFF' : '#1A1A2E', fontSize: 14, fontWeight: '700' }}>
        {isIncome ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
      </Text>
    </View>
  )
}

// ─── Empty day ────────────────────────────────────────────────────────────────

function EmptyDay({ isDark }: { isDark: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28 }}>
      <Text style={{ fontSize: 34, marginBottom: 10 }}>📅</Text>
      <Text style={{ color: isDark ? '#EEEEFF' : '#1A1A2E', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
        No transactions
      </Text>
      <Text style={{ color: isDark ? '#555570' : '#9999AA', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
        Nothing recorded for this day.{'\n'}Tap + to add a transaction.
      </Text>
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const today = getTodayString()
  const todayDate = new Date(today + 'T00:00:00')

  const [viewYear,  setViewYear]  = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(today)

  const { theme, accentColor, currencySymbol } = useSettingsStore()
  const { dailyBudget } = useBudgetStore()
  const { transactions: storeTransactions } = useTransactionStore()
  const { convertToBase } = useExchangeRates()
  const systemScheme = useColorScheme()

  const effectiveTheme = theme === 'system' ? (systemScheme ?? 'dark') : theme
  const isDark = effectiveTheme === 'dark'

  const colors = {
    bg:     isDark ? '#0F0E1A' : '#F2F2F8',
    card:   isDark ? '#1A1928' : '#FFFFFF',
    text:   isDark ? '#EEEEFF' : '#1A1A2E',
    sub:    isDark ? '#555570' : '#9999AA',
    border: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const weeks = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const dotMap = useMemo(
    () => buildDotMap(storeTransactions, viewYear, viewMonth),
    [storeTransactions, viewYear, viewMonth]
  )

  const monthSummary = useMemo(
    () => getMonthSummary(storeTransactions, viewYear, viewMonth, convertToBase),
    [storeTransactions, viewYear, viewMonth, convertToBase]
  )

  const dayStats = useMemo(
    () => getDayStats(storeTransactions, selectedDate, dailyBudget, convertToBase),
    [storeTransactions, selectedDate, dailyBudget, convertToBase]
  )

  const dayTransactions = useMemo(
    () => getTransactionsForDate(storeTransactions, selectedDate),
    [storeTransactions, selectedDate]
  )

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handlePrevMonth = () => {
    const { year, month } = navigateMonth(viewYear, viewMonth, -1)
    setViewYear(year)
    setViewMonth(month)
  }

  const handleNextMonth = () => {
    const { year, month } = navigateMonth(viewYear, viewMonth, 1)
    setViewYear(year)
    setViewMonth(month)
  }

  const handleDayPress = (dateStr: string) => {
    setSelectedDate(dateStr)
  }

  // Prevent navigating past the current month
  const canGoForward =
    viewYear < todayDate.getFullYear() ||
    (viewYear === todayDate.getFullYear() && viewMonth < todayDate.getMonth())

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar</Text>
          <View style={styles.bellWrap}>
            <BellIcon />
            <View style={[styles.bellDot, { borderColor: colors.bg }]} />
          </View>
        </View>

        {/* Month navigator */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={handlePrevMonth}
            hitSlop={10}
            style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityLabel="Previous month"
          >
            <ChevronLeft color={colors.text} />
          </Pressable>

          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {formatMonthHeader(viewYear, viewMonth)}
          </Text>

          <Pressable
            onPress={handleNextMonth}
            hitSlop={10}
            disabled={!canGoForward}
            style={[
              styles.navBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: canGoForward ? 1 : 0.3,
              },
            ]}
            accessibilityLabel="Next month"
          >
            <ChevronRight color={colors.text} />
          </Pressable>
        </View>

        {/* Summary pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          <View style={[styles.pill, { backgroundColor: 'rgba(0,201,167,0.10)', borderColor: 'rgba(0,201,167,0.22)' }]}>
            <Text style={[styles.pillText, { color: '#00C9A7' }]}>
              {'↑ '}{currencySymbol}{monthSummary.totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.22)' }]}>
            <Text style={[styles.pillText, { color: '#FF6B6B' }]}>
              {'↓ '}{currencySymbol}{monthSummary.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}38` }]}>
            <Text style={[styles.pillText, { color: accentColor }]}>
              {'✦ '}{currencySymbol}{Math.abs(monthSummary.savings).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </ScrollView>

        {/* Calendar card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CalendarGrid
            weeks={weeks}
            year={viewYear}
            month={viewMonth}
            today={today}
            selectedDate={selectedDate}
            dotMap={dotMap}
            accentColor={accentColor}
            isDark={isDark}
            onDayPress={handleDayPress}
          />
        </View>

        {/* Day detail panel */}
        <View style={[styles.dayPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Drag handle (decorative) */}
          <View style={[styles.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }]} />

          {/* Date heading + budget ring */}
          <View style={styles.dayPanelHeader}>
            <Text style={[styles.dayPanelTitle, { color: colors.text }]}>
              {formatDayLabel(selectedDate)}
            </Text>
            <BudgetRing percentage={dayStats.budgetPercentage} />
          </View>

          {/* Spent / Remaining */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(15,14,26,0.55)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.sub }]}>SPENT</Text>
              <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                {currencySymbol}{dayStats.spent.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(15,14,26,0.55)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.sub }]}>REMAINING</Text>
              <Text style={[styles.statValue, { color: '#00C9A7' }]}>
                {currencySymbol}{dayStats.remaining.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Transactions or empty state */}
          {dayTransactions.length > 0 ? (
            <View style={styles.txnList}>
              {dayTransactions.map(t => (
                <DayTransactionRow
                  key={t.id}
                  transaction={t}
                  currencySymbol={currencySymbol}
                  isDark={isDark}
                />
              ))}
            </View>
          ) : (
            <EmptyDay isDark={isDark} />
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#6C63FF',
    borderWidth: 1.5,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  pillsRow: {
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  calendarCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  dayPanel: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  dayPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayPanelTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  txnList: {
    gap: 10,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  txnIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
