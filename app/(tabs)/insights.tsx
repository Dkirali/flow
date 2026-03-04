import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  Alert,
  Modal,
} from 'react-native'
import { useState, useMemo } from 'react'
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg'
import { X, Info, ChevronDown } from 'lucide-react-native'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { useTransactionStore } from '@/stores/transactionStore'
import {
  getMonthlySummary,
  getSpendingPatterns,
  getInvestmentAlternative,
  getSavingsStreak,
  getSubscriptions,
  getSavingsForecast,
  getAIGoal,
  getRecentExpenses,
  calculateDailyInvestment,
  getEnhancedSavingsForecast,
  type DailyInvestmentResult,
  type InvestmentComparison,
} from '@/utils/insightsLogic'

// ─── Colour tokens (mirrors other screens) ────────────────────────────────────

function useColors(isDark: boolean, accentColor: string) {
  return {
    bg:      isDark ? '#0F0E1A' : '#F2F2F8',
    card:    isDark ? '#1A1928' : '#FFFFFF',
    text:    isDark ? '#EEEEFF' : '#1A1A2E',
    sub:     isDark ? '#555570' : '#9999AA',
    border:  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    track:   isDark ? '#2E2D45' : '#E0E0EC',
    accent:  accentColor,
    income:  '#00C9A7',
    expense: '#FF6B6B',
  }
}

// ─── Sparkle icon ─────────────────────────────────────────────────────────────

function SparkleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
        fill={color}
      />
    </Svg>
  )
}

// ─── Spending Patterns — vertical bar chart ───────────────────────────────────

function SpendingPatternChart({
  points,
  accentColor,
  subColor,
  trackColor,
  currencySymbol,
}: {
  points: ReturnType<typeof getSpendingPatterns>
  accentColor: string
  subColor: string
  trackColor: string
  currencySymbol: string
}) {
  const BAR_AREA_HEIGHT = 90
  const maxAmt = Math.max(...points.map(p => p.amount), 1)
  const avg = points.reduce((s, p) => s + p.amount, 0) / points.length
  const avgY = BAR_AREA_HEIGHT - (avg / maxAmt) * BAR_AREA_HEIGHT

  // Format value for display (shortened if large)
  const formatValue = (val: number) => {
    if (val === 0) return ''
    if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(1)}k`
    return `${currencySymbol}${Math.round(val)}`
  }

  return (
    <View>
      {/* AVG label */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Text style={{ color: subColor, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>AVG</Text>
      </View>

      {/* Chart area */}
      <View style={{ height: BAR_AREA_HEIGHT + 35, position: 'relative' }}>
        {/* Average dashed line */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: avgY,
            height: 1,
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: subColor,
            opacity: 0.5,
          }}
        />

        {/* Bars with value labels */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_AREA_HEIGHT, gap: 6 }}>
          {points.map((p, i) => {
            const barH = maxAmt > 0 ? Math.max((p.amount / maxAmt) * BAR_AREA_HEIGHT, 4) : 4
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: BAR_AREA_HEIGHT }}>
                {/* Value label */}
                {p.amount > 0 && (
                  <Text 
                    style={{ 
                      color: p.isToday ? accentColor : subColor, 
                      fontSize: 9, 
                      fontWeight: '600',
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {formatValue(p.amount)}
                  </Text>
                )}
                <View
                  style={{
                    width: '100%',
                    height: barH,
                    backgroundColor: p.isToday ? accentColor : trackColor,
                    borderRadius: 4,
                    opacity: p.amount === 0 ? 0.3 : 1,
                  }}
                />
              </View>
            )
          })}
        </View>

        {/* Day labels */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {points.map((p, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: p.isToday ? accentColor : subColor, fontSize: 11, fontWeight: p.isToday ? '800' : '600' }}>
                {p.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

// ─── Savings Forecast — SVG line chart ───────────────────────────────────────

function ForecastChart({
  points,
  accentColor,
  subColor,
}: {
  points: ReturnType<typeof getSavingsForecast>['points']
  accentColor: string
  subColor: string
}) {
  const { width: screenWidth } = useWindowDimensions()
  const chartWidth = screenWidth - 48 - 32  // screen padding + card padding
  const chartHeight = 110
  const padL = 8
  const padR = 8
  const padT = 10
  const padB = 28

  const innerW = chartWidth - padL - padR
  const innerH = chartHeight - padT - padB

  const maxVal = Math.max(...points.map(p => Math.max(p.optimistic, p.conservative)), 1)

  const nx = (i: number) => padL + (i / (points.length - 1)) * innerW
  const ny = (v: number) => padT + innerH - (v / maxVal) * innerH

  const optimisticPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${nx(i).toFixed(1)} ${ny(p.optimistic).toFixed(1)}`)
    .join(' ')

  const conservativePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${nx(i).toFixed(1)} ${ny(p.conservative).toFixed(1)}`)
    .join(' ')

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Conservative line (dashed) */}
      <Path
        d={conservativePath}
        stroke={subColor}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="4 3"
      />

      {/* Optimistic line (solid) */}
      <Path
        d={optimisticPath}
        stroke={accentColor}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Month labels */}
      {points.map((p, i) => (
        <SvgText
          key={i}
          x={nx(i)}
          y={chartHeight - 4}
          textAnchor="middle"
          fontSize={9}
          fill={subColor}
          fontWeight="600"
        >
          {p.month}
        </SvgText>
      ))}

      {/* Dots on optimistic line */}
      {points.map((p, i) => (
        <Circle
          key={`dot-${i}`}
          cx={nx(i)}
          cy={ny(p.optimistic)}
          r={3}
          fill={accentColor}
        />
      ))}
    </Svg>
  )
}

// ─── Savings Streak — dot grid ────────────────────────────────────────────────

function SavingsStreakGrid({
  days,
  subColor,
}: {
  days: ReturnType<typeof getSavingsStreak>['days']
  subColor: string
}) {
  const DOT = 10
  const GAP = 5

  // Chunk into rows of 7
  const rows: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7))
  }

  const dotColor = (status: string) => {
    if (status === 'on') return '#00C9A7'
    if (status === 'over') return '#FF6B6B'
    return 'rgba(255,255,255,0.08)'
  }

  return (
    <View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: GAP, marginBottom: GAP }}>
          {row.map((day, di) => (
            <View
              key={di}
              style={{
                width: DOT,
                height: DOT,
                borderRadius: DOT / 2,
                backgroundColor: dotColor(day.status),
              }}
            />
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00C9A7' }]} />
          <Text style={[styles.legendText, { color: subColor }]}>ON BUDGET</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={[styles.legendText, { color: subColor }]}>OVER BUDGET</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
          <Text style={[styles.legendText, { color: subColor }]}>NO DATA</Text>
        </View>
      </View>
    </View>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({
  children,
  cardColor,
  borderColor,
  style,
}: {
  children: React.ReactNode
  cardColor: string
  borderColor: string
  style?: object
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardColor, borderColor },
        style,
      ]}
    >
      {children}
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type InvestTab = 'sp500' | 'bitcoin' | 'gold' | 'realEstate'
const INVEST_TABS: { key: InvestTab; label: string }[] = [
  { key: 'sp500',      label: 'S&P 500' },
  { key: 'bitcoin',    label: 'Bitcoin' },
  { key: 'gold',       label: 'Gold' },
  { key: 'realEstate', label: 'Real Est.' },
]

// ─── Info Tooltip Component ───────────────────────────────────────────────────

function InfoTooltip({ text, color }: { text: string; color: string }) {
  const [visible, setVisible] = useState(false)
  
  return (
    <View style={{ position: 'relative' }}>
      <Pressable onPress={() => setVisible(!visible)}>
        <Info size={16} color={color} />
      </Pressable>
      {visible && (
        <View style={{
          position: 'absolute',
          top: 20,
          right: 0,
          width: 220,
          backgroundColor: '#1A1928',
          borderRadius: 12,
          padding: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 1000,
        }}>
          <Text style={{ color: '#EEEEFF', fontSize: 12, lineHeight: 18 }}>
            {text}
          </Text>
        </View>
      )}
    </View>
  )
}

export default function InsightsScreen() {
  const [investTab, setInvestTab] = useState<InvestTab>('sp500')
  const [goalAccepted, setGoalAccepted] = useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)
  const [showExpenseSelector, setShowExpenseSelector] = useState(false)

  const { name } = useUserStore()
  const { theme, accentColor, currencySymbol, monthlyIncome } = useSettingsStore()
  const { dailyBudget, mandatoryExpenses } = useBudgetStore()
  const { transactions: storeTransactions } = useTransactionStore()
  const systemScheme = useColorScheme()

  const effectiveTheme = theme === 'system' ? (systemScheme ?? 'dark') : theme
  const isDark = effectiveTheme === 'dark'
  const c = useColors(isDark, accentColor)

  const now = new Date()

  // ── Derived insights ────────────────────────────────────────────────────────

  const summary = useMemo(
    () => getMonthlySummary(storeTransactions, monthlyIncome, now),
    [storeTransactions, monthlyIncome]
  )

  const patterns = useMemo(
    () => getSpendingPatterns(storeTransactions, now),
    [storeTransactions]
  )

  const investment = useMemo(
    () => getInvestmentAlternative(storeTransactions, now),
    [storeTransactions]
  )

  const { days: streakDays, streak } = useMemo(
    () => getSavingsStreak(storeTransactions, dailyBudget, now),
    [storeTransactions, dailyBudget]
  )

  const subscriptions = useMemo(
    () => getSubscriptions(storeTransactions, now),
    [storeTransactions]
  )

  const { points: forecastPoints, estimatedTotal } = useMemo(
    () => getSavingsForecast(storeTransactions, monthlyIncome, now),
    [storeTransactions, monthlyIncome]
  )

  const goal = useMemo(
    () => getAIGoal(storeTransactions, monthlyIncome, now),
    [storeTransactions, monthlyIncome]
  )

  // ── New Investment Alternative ───────────────────────────────────────────────
  
  const recentExpenses = useMemo(
    () => getRecentExpenses(storeTransactions, 10, now),
    [storeTransactions]
  )

  const selectedExpense = useMemo(() => {
    if (!selectedExpenseId && recentExpenses.length > 0) {
      return recentExpenses[0]
    }
    return recentExpenses.find(e => e.expenseId === selectedExpenseId) || recentExpenses[0]
  }, [recentExpenses, selectedExpenseId])

  const investmentComparison = useMemo<InvestmentComparison | null>(() => {
    if (!selectedExpense) return null
    return calculateDailyInvestment(selectedExpense.expenseAmount, investTab)
  }, [selectedExpense, investTab])

  // ── Enhanced Savings Forecast ────────────────────────────────────────────────
  
  const enhancedForecast = useMemo(
    () => getEnhancedSavingsForecast(storeTransactions, monthlyIncome, mandatoryExpenses, now),
    [storeTransactions, monthlyIncome, mandatoryExpenses]
  )

  const userInitial = (name || 'U').charAt(0).toUpperCase()

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SparkleIcon color={c.accent} />
            <Text style={[styles.headerTitle, { color: c.text }]}>AI Insights</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: c.accent }]}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 16 }}>

          {/* ── 1. Monthly Summary ──────────────────────────────────────── */}
          <Card cardColor={c.card} borderColor={c.border}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Your {summary.monthName} Summary
            </Text>
            <Text style={[styles.summaryBody, { color: c.sub }]}>
              {summary.savingsChangePercent >= 0
                ? `You've managed to save `
                : `Your savings are `}
              <Text style={{ color: summary.savingsChangePercent >= 0 ? c.income : c.expense, fontWeight: '700' }}>
                {Math.abs(summary.savingsChangePercent)}%{' '}
                {summary.savingsChangePercent >= 0 ? 'more' : 'less'}
              </Text>
              {summary.savingsChangePercent >= 0
                ? ` than last month. Reducing your ${summary.biggestReductionCategory.toLowerCase()} expenses has made a significant impact on your trajectory.`
                : ` than last month. Consider reducing ${summary.biggestReductionCategory.toLowerCase()} expenses to get back on track.`}
            </Text>

            {/* Pill badges */}
            <View style={styles.pillsRow}>
              <View style={[styles.pill, { backgroundColor: `${c.income}18`, borderColor: `${c.income}38` }]}>
                <Text style={[styles.pillText, { color: c.income }]}>
                  {summary.savingsChangePercent >= 0 ? '↑' : '↓'} {Math.abs(summary.savingsChangePercent)}% Saved
                </Text>
              </View>

              {summary.biggestReductionAmount > 0 && (
                <View style={[styles.pill, { backgroundColor: `${c.expense}18`, borderColor: `${c.expense}38` }]}>
                  <Text style={[styles.pillText, { color: c.expense }]}>
                    ↓ {currencySymbol}{summary.biggestReductionAmount} {summary.biggestReductionCategory}
                  </Text>
                </View>
              )}

              {streak > 0 && (
                <View style={[styles.pill, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}38` }]}>
                  <Text style={[styles.pillText, { color: c.accent }]}>
                    🔥 {streak} Day Str.
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* ── 2. Spending Patterns ────────────────────────────────────── */}
          <Card cardColor={c.card} borderColor={c.border}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Spending Patterns</Text>
            <Text style={[styles.sectionSubtitle, { color: c.sub }]}>
              Daily average spend (last 30 days)
            </Text>
            <View style={{ marginTop: 12 }}>
              <SpendingPatternChart
                points={patterns}
                accentColor={c.accent}
                subColor={c.sub}
                trackColor={c.track}
                currencySymbol={currencySymbol}
              />
            </View>
          </Card>

          {/* ── 3. Investment Alternative ───────────────────────────────── */}
          <Card cardColor={c.card} borderColor={c.border}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Investment Alternative</Text>
              <InfoTooltip 
                text="This shows what would have happened if you had invested this expense amount instead. Based on that asset's daily % change." 
                color={c.sub}
              />
            </View>
            <Text style={[styles.sectionSubtitle, { color: c.sub }]}>
              What if you invested an expense instead?
            </Text>

            {/* Expense Selector */}
            {recentExpenses.length > 0 && selectedExpense && (
              <View style={{ marginTop: 16, marginBottom: 16 }}>
                <Pressable
                  onPress={() => setShowExpenseSelector(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isDark ? '#2E2D45' : '#F0EFF8',
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.sub, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 }}>
                      {selectedExpense.expenseCategory.toUpperCase()}
                    </Text>
                    <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
                      {currencySymbol}{selectedExpense.expenseAmount.toFixed(2)}
                    </Text>
                    <Text style={{ color: c.sub, fontSize: 11, marginTop: 2 }}>
                      {selectedExpense.expenseName}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={c.sub} />
                </Pressable>
              </View>
            )}

            {recentExpenses.length === 0 && (
              <View style={{ marginTop: 16, marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ color: c.sub, fontSize: 13, textAlign: 'center' }}>
                  No expenses to compare. Add some transactions first!
                </Text>
              </View>
            )}

            {/* Comparison Result */}
            {investmentComparison && (
              <View style={{ marginBottom: 16 }}>
                {/* Original Amount */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#2E2D45' : '#F0EFF8',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                }}>
                  <Text style={{ color: c.sub, fontSize: 13, fontWeight: '600' }}>Original</Text>
                  <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>
                    {currencySymbol}{investmentComparison.originalAmount.toFixed(2)}
                  </Text>
                </View>

                {/* Result Amount */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#2E2D45' : '#F0EFF8',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                }}>
                  <View>
                    <Text style={{ color: c.sub, fontSize: 13, fontWeight: '600' }}>
                      {INVEST_TABS.find(t => t.key === investTab)?.label} Result
                    </Text>
                    <Text style={{ color: c.sub, fontSize: 11, marginTop: 2 }}>
                      Daily return: {investmentComparison.percentChange > 0 ? '+' : ''}{investmentComparison.percentChange.toFixed(3)}%
                    </Text>
                  </View>
                  <Text style={{ color: investmentComparison.isGain ? c.income : c.expense, fontSize: 18, fontWeight: '700' }}>
                    {currencySymbol}{investmentComparison.resultAmount.toFixed(2)}
                  </Text>
                </View>

                {/* Delta */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: investmentComparison.isGain ? 'rgba(0,201,167,0.1)' : 'rgba(255,107,107,0.1)',
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: investmentComparison.isGain ? 'rgba(0,201,167,0.3)' : 'rgba(255,107,107,0.3)',
                }}>
                  <Text style={{ color: investmentComparison.isGain ? c.income : c.expense, fontSize: 13, fontWeight: '600' }}>
                    {investmentComparison.isGain ? 'Gain' : 'Loss'}
                  </Text>
                  <Text style={{ color: investmentComparison.isGain ? c.income : c.expense, fontSize: 18, fontWeight: '700' }}>
                    {investmentComparison.isGain ? '+' : ''}{currencySymbol}{Math.abs(investmentComparison.delta).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Investment tabs */}
            <View style={styles.investTabs}>
              {INVEST_TABS.map(tab => (
                <Pressable
                  key={tab.key}
                  onPress={() => setInvestTab(tab.key)}
                  style={[
                    styles.investTabBtn,
                    {
                      backgroundColor: investTab === tab.key ? c.accent : 'transparent',
                      borderColor: investTab === tab.key ? c.accent : c.track,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.investTabText,
                      { color: investTab === tab.key ? '#FFFFFF' : c.sub },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Expense Selector Modal */}
            <Modal
              visible={showExpenseSelector}
              transparent
              animationType="slide"
              onRequestClose={() => setShowExpenseSelector(false)}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <Pressable onPress={(e) => e.stopPropagation()}>
                  <View style={{
                    backgroundColor: c.card,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    padding: 24,
                    maxHeight: '80%',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                      <Text style={{ flex: 1, color: c.text, fontSize: 20, fontWeight: '700' }}>Select Expense</Text>
                      <Pressable onPress={() => setShowExpenseSelector(false)} hitSlop={12}>
                        <X size={22} color={c.sub} />
                      </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {recentExpenses.map((expense) => (
                        <Pressable
                          key={expense.expenseId}
                          onPress={() => {
                            setSelectedExpenseId(expense.expenseId)
                            setShowExpenseSelector(false)
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: c.border,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>
                              {expense.expenseName}
                            </Text>
                            <Text style={{ color: c.sub, fontSize: 12, marginTop: 2 }}>
                              {expense.expenseCategory} • {expense.date}
                            </Text>
                          </View>
                          <Text style={{ color: c.expense, fontSize: 16, fontWeight: '700' }}>
                            -{currencySymbol}{expense.expenseAmount.toFixed(2)}
                          </Text>
                          {selectedExpenseId === expense.expenseId && (
                            <View style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: c.accent,
                              marginLeft: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </Pressable>
              </View>
            </Modal>
          </Card>

          {/* ── 4. Savings Streak ───────────────────────────────────────── */}
          <Card cardColor={c.card} borderColor={c.border}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Savings Streak</Text>
              {streak > 0 && (
                <View style={[styles.streakBadge, { backgroundColor: `${c.income}20`, borderColor: `${c.income}40` }]}>
                  <Text style={[styles.streakBadgeText, { color: c.income }]}>🔥 {streak} days</Text>
                </View>
              )}
            </View>
            <Text style={[styles.sectionSubtitle, { color: c.sub }]}>
              This month's daily budget performance
            </Text>
            <View style={{ marginTop: 12 }}>
              {streakDays.length > 0 ? (
                <SavingsStreakGrid days={streakDays} subColor={c.sub} />
              ) : (
                <Text style={{ color: c.sub, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
                  No data yet — start tracking to see your streak!
                </Text>
              )}
            </View>
          </Card>

          {/* ── 5. Subscription Audit ───────────────────────────────────── */}
          <Card cardColor={c.card} borderColor={c.border}>
            {/* Header row with icon */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <View style={[styles.subIconWrap, { backgroundColor: `${c.accent}20` }]}>
                <Text style={{ fontSize: 14 }}>📋</Text>
              </View>
              <Text style={[styles.sectionTitle, { color: c.text, marginBottom: 0 }]}>Subscription Audit</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: c.sub, marginBottom: 14 }]}>
              Your recurring monthly expenses
            </Text>

            {subscriptions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>📭</Text>
                <Text style={{ color: c.sub, fontSize: 13, textAlign: 'center' }}>
                  No recurring transactions found.{'\n'}Add recurring expenses to see your audit.
                </Text>
              </View>
            ) : (
              <>
                {subscriptions.map((sub, i) => (
                  <View
                    key={sub.id}
                    style={[
                      styles.subRow,
                      {
                        borderBottomColor: c.border,
                        borderBottomWidth: i < subscriptions.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.subName, { color: c.text }]} numberOfLines={1}>
                        {sub.name}
                      </Text>
                      <Text style={[styles.subAmount, { color: c.sub }]}>
                        {currencySymbol}{sub.amount.toFixed(2)}/m
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.subBadge,
                        {
                          backgroundColor:
                            sub.status === 'active' ? 'rgba(0,201,167,0.12)' : 'rgba(255,180,0,0.12)',
                          borderColor:
                            sub.status === 'active' ? 'rgba(0,201,167,0.3)' : 'rgba(255,180,0,0.3)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subBadgeText,
                          { color: sub.status === 'active' ? '#00C9A7' : '#FFB400' },
                        ]}
                      >
                        {sub.status === 'active' ? 'ACTIVE' : 'UNUSED?'}
                      </Text>
                    </View>
                  </View>
                ))}

                <Pressable
                  onPress={() => Alert.alert('Subscription Review', 'Full subscription management coming soon.')}
                  style={[styles.reviewAllBtn, { borderColor: c.border }]}
                >
                  <Text style={[styles.reviewAllText, { color: c.text }]}>REVIEW ALL</Text>
                </Pressable>
              </>
            )}
          </Card>

          {/* ── 6. Enhanced Savings Forecast ─────────────────────────────────────── */}
          <Card cardColor={c.card} borderColor={c.border}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <View>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Savings Forecast</Text>
                <Text style={[styles.sectionSubtitle, { color: c.sub }]}>
                  Based on income, mandatory expenses & discretionary spending
                </Text>
              </View>
              <View style={[styles.estimatedBadge, { 
                backgroundColor: enhancedForecast.isNegative ? 'rgba(255,107,107,0.18)' : `${c.income}18`, 
                borderColor: enhancedForecast.isNegative ? 'rgba(255,107,107,0.38)' : `${c.income}38` 
              }]}>
                <Text style={{ color: c.sub, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                  {enhancedForecast.isNegative ? 'DEFICIT' : 'PROJECTED'}
                </Text>
                <Text style={{ 
                  color: enhancedForecast.isNegative ? c.expense : c.income, 
                  fontSize: 14, 
                  fontWeight: '800' 
                }}>
                  {enhancedForecast.isNegative ? '' : '+'}{currencySymbol}{Math.abs(enhancedForecast.projectedMonthlySavings).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            {/* Calculation breakdown */}
            <View style={{ marginTop: 16, marginBottom: 16 }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8,
                paddingVertical: 8,
              }}>
                <Text style={{ color: c.sub, fontSize: 13 }}>Monthly Income</Text>
                <Text style={{ color: c.income, fontSize: 15, fontWeight: '600' }}>
                  +{currencySymbol}{enhancedForecast.monthlyIncome.toLocaleString()}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8,
                paddingVertical: 8,
              }}>
                <Text style={{ color: c.sub, fontSize: 13 }}>Mandatory Expenses</Text>
                <Text style={{ color: c.expense, fontSize: 15, fontWeight: '600' }}>
                  -{currencySymbol}{enhancedForecast.totalMandatory.toLocaleString()}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
              }}>
                <Text style={{ color: c.sub, fontSize: 13 }}>Avg. Discretionary</Text>
                <Text style={{ color: c.expense, fontSize: 15, fontWeight: '600' }}>
                  -{currencySymbol}{enhancedForecast.avgDiscretionary.toLocaleString()}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: 8,
                paddingVertical: 8,
              }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>Monthly Savings</Text>
                <Text style={{ 
                  color: enhancedForecast.isNegative ? c.expense : c.income, 
                  fontSize: 18, 
                  fontWeight: '800' 
                }}>
                  {enhancedForecast.isNegative ? '-' : '+'}{currencySymbol}{Math.abs(enhancedForecast.projectedMonthlySavings).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* 3-month projection */}
            <View style={{
              backgroundColor: enhancedForecast.isNegative ? 'rgba(255,107,107,0.1)' : 'rgba(0,201,167,0.1)',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: enhancedForecast.isNegative ? 'rgba(255,107,107,0.3)' : 'rgba(0,201,167,0.3)',
            }}>
              <Text style={{ color: c.sub, fontSize: 12, marginBottom: 4 }}>
                3-Month Projection
              </Text>
              <Text style={{ 
                color: enhancedForecast.isNegative ? c.expense : c.income, 
                fontSize: 20, 
                fontWeight: '800' 
              }}>
                {enhancedForecast.isNegative ? '-' : '+'}{currencySymbol}{Math.abs(enhancedForecast.projected3MonthSavings).toLocaleString()}
              </Text>
            </View>

            {/* Warning message if negative */}
            {enhancedForecast.isNegative && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                padding: 12,
                backgroundColor: 'rgba(255,107,107,0.1)',
                borderRadius: 8,
              }}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>⚠️</Text>
                <Text style={{ color: c.expense, fontSize: 13, flex: 1 }}>
                  Your discretionary spending exceeds your income minus mandatory expenses.
                </Text>
              </View>
            )}
          </Card>

          {/* ── 7. AI Goal Card ─────────────────────────────────────────── */}
          <Card cardColor={c.card} borderColor={c.border} style={{ marginBottom: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              {/* Rocket icon */}
              <View style={[styles.rocketWrap, { backgroundColor: `${c.accent}20` }]}>
                <Text style={{ fontSize: 22 }}>🚀</Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalTitle, { color: c.text }]}>
                  Save {currencySymbol}{goal.goalAmount} this month
                </Text>
                <Text style={[styles.goalSubtitle, { color: c.sub }]}>
                  Based on your {goal.currentSpend > 0 ? `reduced ${goal.category.toLowerCase()} ` : ''}spending patterns.
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[styles.progressLabel, { color: c.sub }]}>CURRENT PROGRESS</Text>
                <Text style={[styles.progressLabel, { color: c.sub }]}>{goal.progressPercent}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: c.track }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${goal.progressPercent}%`,
                      backgroundColor: c.accent,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Action buttons */}
            {!goalAccepted ? (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <Pressable
                  onPress={() => setGoalAccepted(true)}
                  style={[styles.acceptBtn, { backgroundColor: c.accent }]}
                >
                  <Text style={styles.acceptBtnText}>ACCEPT GOAL</Text>
                </Pressable>
                <Pressable
                  onPress={() => Alert.alert('Adjust Goal', 'Custom goal setting coming soon.')}
                  style={[styles.adjustBtn, { borderColor: c.border }]}
                >
                  <Text style={[styles.adjustBtnText, { color: c.text }]}>ADJUST</Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={[
                  styles.goalAcceptedBanner,
                  { backgroundColor: `${c.income}15`, borderColor: `${c.income}30` },
                ]}
              >
                <Text style={{ fontSize: 16 }}>✅</Text>
                <Text style={{ color: c.income, fontSize: 13, fontWeight: '700', marginLeft: 8 }}>
                  Goal accepted! You've got this.
                </Text>
              </View>
            )}
          </Card>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // Card
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },

  // Section headings
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 0,
  },

  // Summary
  summaryBody: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Investment Alternative
  investCompare: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  investBox: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  investBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  investBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  investTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  investTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  investTabText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Streak badge
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Subscription
  subIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  subName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subAmount: {
    fontSize: 12,
    fontWeight: '500',
  },
  subBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  subBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  reviewAllBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  reviewAllText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Forecast
  estimatedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },

  // Legend (shared)
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendLineDashed: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // AI Goal
  rocketWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  goalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adjustBtn: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: 'center',
    borderWidth: 1,
  },
  adjustBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  goalAcceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
})
