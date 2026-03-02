import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native'
import { useState, useMemo } from 'react'
import Svg, { Path } from 'react-native-svg'
import { useUserStore } from '@/stores/userStore'
import { 
  aggregateTransactionsByPeriod,
  calculateDashboardStats,
  calculateGoalProgress,
  getRecentTransactions,
  formatTransactionDate,
  getGreeting,
  calculateBudgetRing,
  type TimePeriod,
  type Transaction
} from '@/utils/dashboardLogic'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { BarChart } from 'react-native-gifted-charts'

// Icons
function BellIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="#EEEEFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#EEEEFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
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

function CoffeeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="#EEEEFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

function ShoppingIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="#EEEEFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M3 6h18" stroke="#EEEEFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  )
}

// Mock data
const mockTransactions: Transaction[] = [
  { id: '1', amount: 5.50, category: 'Food & Drink', description: 'Coffee House', date: new Date(Date.now() - 1000 * 60 * 60 * 2), type: 'expense' },
  { id: '2', amount: 120.00, category: 'Shopping', description: 'Retail Store', date: new Date(Date.now() - 1000 * 60 * 60 * 24), type: 'expense' },
  { id: '3', amount: 45.00, category: 'Food & Drink', description: 'Lunch', date: new Date(Date.now() - 1000 * 60 * 60 * 4), type: 'expense' },
  { id: '4', amount: 25.50, category: 'Transport', description: 'Uber', date: new Date(Date.now() - 1000 * 60 * 60 * 6), type: 'expense' },
  { id: '5', amount: 30.00, category: 'Entertainment', description: 'Movies', date: new Date(Date.now() - 1000 * 60 * 60 * 8), type: 'expense' }
]

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month')
  const { name } = useUserStore()
  
  const greeting = getGreeting()
  const userName = name || 'Alex'

  const chartData = useMemo(() => aggregateTransactionsByPeriod(mockTransactions, selectedPeriod), [selectedPeriod])
  const stats = useMemo(() => calculateDashboardStats(mockTransactions, selectedPeriod, 5200), [selectedPeriod])
  const goalProgress = useMemo(() => calculateGoalProgress(mockTransactions, 5200, 20), [])
  const recentTransactions = useMemo(() => getRecentTransactions(mockTransactions, 5), [])
  const budgetRing = useMemo(() => calculateBudgetRing(stats.dailyBudget, stats.spentToday), [stats])

  const periods: { id: TimePeriod; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0E1A' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ color: '#8888AA', fontSize: 12, letterSpacing: 1 }}>WELCOME BACK</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>{greeting}, {userName}</Text>
              </View>
            </View>
            <Pressable style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1928', alignItems: 'center', justifyContent: 'center' }}>
              <BellIcon />
            </Pressable>
          </View>

          {/* Time Period Selector */}
          <View style={{ flexDirection: 'row', backgroundColor: '#1A1928', borderRadius: 28, padding: 4, marginBottom: 16 }}>
            {periods.map((period) => (
              <Pressable
                key={period.id}
                onPress={() => setSelectedPeriod(period.id)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 24, alignItems: 'center', backgroundColor: selectedPeriod === period.id ? '#6C63FF' : 'transparent' }}
              >
                <Text style={{ color: selectedPeriod === period.id ? '#FFFFFF' : '#8888AA', fontWeight: '600', fontSize: 14 }}>{period.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Goal Banner */}
          {goalProgress.remainingToGoal > 0 && goalProgress.remainingToGoal <= 50 && (
            <View style={{ backgroundColor: '#6C63FF', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>✨</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1, letterSpacing: 0.5 }}>{goalProgress.message}</Text>
            </View>
          )}

          {/* Financial Overview Card */}
          <View style={{ backgroundColor: '#1A1928', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Financial Overview</Text>
                <Text style={{ color: '#8888AA', fontSize: 13 }}>Income vs Expenses vs Savings</Text>
              </View>
              <Pressable><Text style={{ color: '#8888AA', fontSize: 20 }}>⋯</Text></Pressable>
            </View>

            <View style={{ height: 180, marginBottom: 16 }}>
              <BarChart
                data={chartData.map(d => ({ value: d.income, label: d.label, frontColor: '#00C9A7' }))}
                barWidth={selectedPeriod === 'year' ? 12 : 20}
                spacing={selectedPeriod === 'year' ? 8 : 16}
                roundedTop
                roundedBottom
                hideAxesAndRules
                hideYAxisText
                xAxisLabelTextStyle={{ color: '#8888AA', fontSize: 11 }}
                noOfSections={4}
                maxValue={Math.max(...chartData.map(d => Math.max(d.income, d.expense, d.savings))) * 1.2}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
              {[{ color: '#00C9A7', label: 'INCOME' }, { color: '#FF6B6B', label: 'EXPENSE' }, { color: '#6C63FF', label: 'SAVINGS' }].map((item) => (
                <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                  <Text style={{ color: '#8888AA', fontSize: 11, fontWeight: '600' }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, backgroundColor: '#1A1928', borderRadius: 16, padding: 16 }}>
              <TrendingUpIcon />
              <Text style={{ color: '#8888AA', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }}>TOTAL INCOME</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>${stats.totalIncome.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#1A1928', borderRadius: 16, padding: 16 }}>
              <TrendingDownIcon />
              <Text style={{ color: '#8888AA', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }}>TOTAL EXPENSES</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>${stats.totalExpenses.toLocaleString()}</Text>
            </View>
          </View>

          {/* Daily Budget Ring */}
          <View style={{ backgroundColor: '#1A1928', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center' }}>
            <Text style={{ color: '#8888AA', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 20 }}>DAILY BUDGET RING</Text>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing percentage={(budgetRing.spent / stats.dailyBudget) * 100} size={180} strokeWidth={12} color="#00C9A7" />
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700' }}>${budgetRing.remaining.toFixed(2)}</Text>
                  <Text style={{ color: '#8888AA', fontSize: 12 }}>REMAINING</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', width: '100%' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: '#FF6B6B', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>${budgetRing.spent.toFixed(2)}</Text>
                <Text style={{ color: '#8888AA', fontSize: 11, fontWeight: '600' }}>SPENT TODAY</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>{stats.daysRemaining}</Text>
                <Text style={{ color: '#8888AA', fontSize: 11, fontWeight: '600' }}>DAYS REMAINING</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Recent Activity</Text>
              <Pressable><Text style={{ color: '#6C63FF', fontSize: 13, fontWeight: '600' }}>VIEW ALL</Text></Pressable>
            </View>
            {recentTransactions.map((transaction, index) => (
              <View key={transaction.id} style={{ backgroundColor: '#1A1928', borderRadius: 16, padding: 16, marginBottom: index !== recentTransactions.length - 1 ? 8 : 0, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E2D45', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  {transaction.category === 'Food & Drink' ? <CoffeeIcon /> : <ShoppingIcon />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 2 }}>{transaction.description}</Text>
                  <Text style={{ color: '#8888AA', fontSize: 12 }}>{transaction.category.toUpperCase()} • {formatTransactionDate(transaction.date)}</Text>
                </View>
                <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '700' }}>-${transaction.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => console.log('FAB pressed - Add Transaction')}
        style={{ position: 'absolute', right: 24, bottom: 100, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }}
      >
        <View style={{ position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#00C9A7', opacity: 0.3 }} />
        <PlusIcon />
      </Pressable>
    </SafeAreaView>
  )
}