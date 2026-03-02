import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { type TimePeriod } from '@/utils/dashboardLogic'

interface ChartDataPoint {
  label: string
  income: number
  expense: number
  savings: number
}

interface HorizontalBarChartProps {
  data: ChartDataPoint[]
  period: TimePeriod
  title?: string
}

export default function HorizontalBarChart({ data, period, title }: HorizontalBarChartProps) {
  // Get the two most recent periods for comparison
  const currentPeriod = data[data.length - 1] || { label: 'Current', income: 0, expense: 0, savings: 0 }
  const previousPeriod = data[data.length - 2] || { label: 'Previous', income: 0, expense: 0, savings: 0 }
  
  // Calculate max value for scaling (across both periods)
  const maxValue = Math.max(
    currentPeriod.income, previousPeriod.income,
    currentPeriod.expense, previousPeriod.expense,
    currentPeriod.savings, previousPeriod.savings,
    1 // Prevent division by zero
  )
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`
    }
    return `$${Math.round(amount)}`
  }
  
  const renderBarRow = (
    label: string,
    currentValue: number,
    previousValue: number,
    color: string,
    labelColor: string
  ) => {
    const currentWidth = Math.max((currentValue / maxValue) * 100, 0)
    const previousWidth = Math.max((previousValue / maxValue) * 100, 0)
    
    return (
      <View style={styles.row}>
        <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
        
        <View style={styles.barsContainer}>
          {/* Current Period Bar */}
          <View style={styles.barRow}>
            <View style={styles.barTrack}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${currentWidth}%`,
                    backgroundColor: color
                  }
                ]} 
              />
            </View>
            <Text style={styles.barValue}>{formatCurrency(currentValue)}</Text>
          </View>
          
          {/* Previous Period Bar (Ghost/Comparison) */}
          {previousValue > 0 && (
            <View style={styles.barRow}>
              <View style={styles.barTrack}>
                <View 
                  style={[
                    styles.bar, 
                    styles.ghostBar,
                    { 
                      width: `${previousWidth}%`,
                      backgroundColor: color
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.barValue, styles.ghostText]}>
                {formatCurrency(previousValue)}
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00C9A7' }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>Expense</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6C63FF' }]} />
          <Text style={styles.legendText}>Savings</Text>
        </View>
      </View>
      
      {/* Period Labels */}
      <View style={styles.periodLabels}>
        <Text style={styles.periodLabelCurrent}>{currentPeriod.label} (Current)</Text>
        {previousPeriod.income > 0 || previousPeriod.expense > 0 ? (
          <Text style={styles.periodLabelPrevious}>{previousPeriod.label} (Previous)</Text>
        ) : null}
      </View>
      
      {/* Income Row */}
      {renderBarRow('INCOME', currentPeriod.income, previousPeriod.income, '#00C9A7', '#00C9A7')}
      
      {/* Expense Row */}
      {renderBarRow('EXPENSE', currentPeriod.expense, previousPeriod.expense, '#FF6B6B', '#FF6B6B')}
      
      {/* Savings Row */}
      {renderBarRow('SAVINGS', currentPeriod.savings, previousPeriod.savings, '#6C63FF', '#6C63FF')}
      
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {currentPeriod.label}: {' '}
          <Text style={{ color: currentPeriod.savings >= 0 ? '#00C9A7' : '#FF6B6B' }}>
            {currentPeriod.savings >= 0 ? '+' : ''}{formatCurrency(currentPeriod.savings)} saved
          </Text>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
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
  legendText: {
    color: '#8888AA',
    fontSize: 11,
    fontWeight: '600',
  },
  periodLabels: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 50,
    marginBottom: 8,
    gap: 20,
  },
  periodLabelCurrent: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  periodLabelPrevious: {
    color: '#8888AA',
    fontSize: 10,
  },
  row: {
    marginBottom: 16,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  barsContainer: {
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#2E2D45',
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  ghostBar: {
    opacity: 0.4,
  },
  barValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  ghostText: {
    color: '#8888AA',
  },
  summary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2E2D45',
  },
  summaryText: {
    color: '#8888AA',
    fontSize: 13,
    textAlign: 'center',
  },
})
