import React, { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { DotMap } from '@/utils/calendarLogic'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarGridProps {
  weeks: (number | null)[][]
  year: number
  month: number
  /** Today's date as "YYYY-MM-DD" */
  today: string
  /** Currently selected date as "YYYY-MM-DD", or null */
  selectedDate: string | null
  dotMap: DotMap
  accentColor: string
  isDark: boolean
  onDayPress: (dateStr: string) => void
}

interface DayCellProps {
  day: number | null
  dateStr: string
  isToday: boolean
  isSelected: boolean
  hasTransactions: boolean
  dots: DotMap[string] | undefined
  accentColor: string
  isDark: boolean
  onPress: () => void
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({
  day,
  dateStr,
  isToday,
  isSelected,
  hasTransactions,
  dots,
  accentColor,
  isDark,
  onPress,
}: DayCellProps) {
  // Empty padding cell
  if (day === null) return <View style={styles.cellEmpty} />

  // Text colour: white if active/has data, muted if no transactions
  const numberColor = isToday || isSelected
    ? '#FFFFFF'
    : hasTransactions
      ? isDark ? '#EEEEFF' : '#1A1A2E'
      : isDark ? '#3A3A5A' : '#BBBBCC'

  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={styles.cell}
      accessibilityRole="button"
      accessibilityLabel={`${day}`}
      accessibilityState={{ selected: isSelected }}
    >
      {/* Today highlight: filled circle */}
      {isToday && (
        <View
          style={[
            styles.cellHighlight,
            { backgroundColor: accentColor, borderRadius: 18 },
          ]}
        />
      )}

      {/* Selected (non-today): softer rounded square */}
      {isSelected && !isToday && (
        <View
          style={[
            styles.cellHighlight,
            { backgroundColor: accentColor + '28', borderRadius: 8 },
          ]}
        />
      )}

      {/* Selected border ring (only when not today) */}
      {isSelected && !isToday && (
        <View
          style={[
            styles.cellHighlight,
            {
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: accentColor + '80',
            },
          ]}
        />
      )}

      <Text
        style={[
          styles.dayNumber,
          {
            color: numberColor,
            fontWeight: isToday || isSelected ? '700' : '500',
          },
        ]}
      >
        {day}
      </Text>

      {/* Activity dots (income = teal, expense = red) */}
      <View style={styles.dotsRow}>
        {dots?.hasIncome  && <View style={[styles.dot, { backgroundColor: '#00C9A7' }]} />}
        {dots?.hasExpense && <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />}
      </View>
    </Pressable>
  )
}

const MemoizedDayCell = memo(DayCell)

// ─── Calendar grid ────────────────────────────────────────────────────────────

export function CalendarGrid({
  weeks,
  year,
  month,
  today,
  selectedDate,
  dotMap,
  accentColor,
  isDark,
  onDayPress,
}: CalendarGridProps) {
  return (
    <View>
      {/* Day-of-week header row */}
      <View style={styles.headerRow}>
        {DAY_HEADERS.map(h => (
          <Text
            key={h}
            style={[styles.headerLabel, { color: isDark ? '#3A3A5A' : '#AAAACC' }]}
          >
            {h}
          </Text>
        ))}
      </View>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            const dateStr = day
              ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              : ''
            return (
              <MemoizedDayCell
                key={di}
                day={day}
                dateStr={dateStr}
                isToday={dateStr === today}
                isSelected={dateStr === selectedDate}
                hasTransactions={!!dotMap[dateStr]}
                dots={dotMap[dateStr]}
                accentColor={accentColor}
                isDark={isDark}
                onPress={() => day && onDayPress(dateStr)}
              />
            )
          })}
        </View>
      ))}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingVertical: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmpty: {
    flex: 1,
    height: 52,
  },
  cellHighlight: {
    position: 'absolute',
    width: 36,
    height: 36,
  },
  dayNumber: {
    fontSize: 14,
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 5,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
})
