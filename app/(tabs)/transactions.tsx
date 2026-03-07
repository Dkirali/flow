import {
  View,
  Text,
  Pressable,
  SectionList,
  TextInput,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useMemo } from 'react'
import { router } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { format, subDays } from 'date-fns'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTransactionStore } from '@/stores/transactionStore'
import {
  type Transaction as DashboardTransaction,
} from '@/utils/dashboardLogic'
import type { Transaction } from '@/types/transaction'
import { SwipeableTransactionItem } from '@/components/ui/SwipeableTransactionItem'
import { AddTransactionModal } from '@/components/ui/AddTransactionModal'
import DraggableFAB from '@/components/ui/DraggableFAB'
import { getTodayString } from '@/utils/dateHelpers'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'income' | 'expense' | 'mandatory'

interface Section {
  title: string
  data: DashboardTransaction[]
}

const FILTERS: { id: FilterType; label: string; icon?: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'income',    label: 'Income' },
  { id: 'expense',   label: 'Expenses' },
  { id: 'mandatory', label: 'Mandatory' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeftIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function MicIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function FilterIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M7 12h10M10 18h4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function SortIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#1A1928' : '#F0EFF8' }]}>
        <Text style={{ fontSize: 36 }}>💳</Text>
      </View>
      <Text style={{ color: isDark ? '#FFFFFF' : '#1A1A2E', fontSize: 17, fontWeight: '700', marginBottom: 8 }}>
        No transactions found
      </Text>
      <Text style={{ color: isDark ? '#8888AA' : '#9999AA', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        Try adjusting your filters or{'\n'}add a new transaction.
      </Text>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const [searchQuery,     setSearchQuery]     = useState('')
  const [activeFilter,    setActiveFilter]    = useState<FilterType>('all')
  const [showModal,       setShowModal]       = useState(false)
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null)

  const { theme, accentColor } = useSettingsStore()
  const { transactions: storeTransactions, deleteTransaction } = useTransactionStore()
  const systemScheme = useColorScheme()

  const effectiveTheme = theme === 'system' ? (systemScheme ?? 'dark') : theme
  const isDark = effectiveTheme === 'dark'

  const colors = {
    bg:      isDark ? '#0F0E1A' : '#F8F9FA',
    card:    isDark ? '#1A1928' : '#FFFFFF',
    text:    isDark ? '#FFFFFF' : '#1A1A2E',
    subtext: isDark ? '#8888AA' : '#6B7280',
    divider: isDark ? '#2E2D45' : '#E5E7EB',
    accent:  accentColor,
  }

  // Map store transactions → DashboardTransaction (same pattern as index.tsx)
  const transactions = useMemo<DashboardTransaction[]>(() =>
    storeTransactions.map(t => ({
      id:           t.id,
      amount:       t.amount,
      category:     t.category,
      description:  t.note ?? t.category,
      date:         new Date(`${t.date}T${t.time}:00`),
      type:         t.type,
      currencyCode: t.currencyCode ?? 'USD',
      isMandatory:  t.isMandatory,
      isLeisure:    t.isLeisure,
      isRecurring:  t.isRecurring,
    })),
    [storeTransactions]
  )

  // Apply filter + search, sort newest first
  const filtered = useMemo(() => {
    let result = transactions
    if      (activeFilter === 'income')    result = result.filter(t => t.type === 'income')
    else if (activeFilter === 'expense')   result = result.filter(t => t.type === 'expense')
    else if (activeFilter === 'mandatory') result = result.filter(t => t.isMandatory)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    }

    return [...result].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [transactions, activeFilter, searchQuery])

  // Group into date sections for SectionList
  const sections = useMemo<Section[]>(() => {
    const today     = getTodayString()
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
    const map       = new Map<string, DashboardTransaction[]>()

    for (const t of filtered) {
      const dateStr = format(t.date, 'yyyy-MM-dd')
      const title   =
        dateStr === today     ? 'TODAY'
        : dateStr === yesterday ? 'YESTERDAY'
        : format(t.date, 'MMM d').toUpperCase()

      if (!map.has(title)) map.set(title, [])
      map.get(title)!.push(t)
    }

    return Array.from(map.entries()).map(([title, data]) => ({ title, data }))
  }, [filtered])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.circleBtn, { backgroundColor: colors.card }]}
        >
          <ChevronLeftIcon color={colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Transactions</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={[styles.circleBtn, { backgroundColor: colors.card }]}>
            <FilterIcon color={colors.text} />
          </Pressable>
          <Pressable style={[styles.circleBtn, { backgroundColor: colors.card }]}>
            <SortIcon color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
        <SearchIcon color={colors.subtext} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <MicIcon color={colors.subtext} />
      </View>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map(f => {
          const active = activeFilter === f.id
          return (
            <Pressable
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.card,
                  borderColor:     active ? colors.accent : colors.divider,
                },
              ]}
            >
              {f.id === 'mandatory' && (
                <ShieldIcon color={active ? '#FFFFFF' : colors.subtext} />
              )}
              <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.subtext }]}>
                {f.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* ── Transaction list ───────────────────────────────────────────────── */}
      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[
          styles.listContent,
          sections.length === 0 && { flex: 1 },
        ]}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: colors.subtext }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <SwipeableTransactionItem
            transaction={item}
            isDark={isDark}
            onEdit={t => {
              // Look up the original store transaction to get the correct type
              // (string date/time) that AddTransactionModal expects
              const original = storeTransactions.find(st => st.id === t.id)
              if (original) {
                setEditTransaction(original)
                setShowModal(true)
              }
            }}
            onDelete={t => deleteTransaction(t.id)}
          />
        )}
        ListEmptyComponent={<EmptyState isDark={isDark} />}
      />

      {/* ── FAB — same component as dashboard ──────────────────────────────── */}
      <DraggableFAB
        onPress={() => {
          setEditTransaction(null)
          setShowModal(true)
        }}
      />

      {/* ── Add / Edit modal ───────────────────────────────────────────────── */}
      <AddTransactionModal
        visible={showModal}
        onClose={() => {
          setShowModal(false)
          setEditTransaction(null)
        }}
        editTransaction={editTransaction ?? undefined}
      />

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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  // Filter chips
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
})
