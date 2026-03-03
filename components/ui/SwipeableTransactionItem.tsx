import React, { useRef, useCallback } from 'react'
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { type Transaction as DashboardTransaction } from '@/utils/dashboardLogic'
import { formatTransactionDate } from '@/utils/dashboardLogic'
import { Pencil, Trash2 } from 'lucide-react-native'
import { useSettingsStore } from '@/stores/settingsStore'
import { getCurrencyByCode } from '@/constants/currencies'

interface SwipeableTransactionItemProps {
  transaction: DashboardTransaction
  isDark: boolean
  onEdit: (transaction: DashboardTransaction) => void
  onDelete: (transaction: DashboardTransaction) => void
}

export function SwipeableTransactionItem({
  transaction,
  isDark,
  onEdit,
  onDelete,
}: SwipeableTransactionItemProps) {
  const swipeableRef = useRef<Swipeable>(null)
  const { currency } = useSettingsStore()
  const currencySymbol = getCurrencyByCode(currency)?.symbol ?? '$'

  const handleEdit = useCallback(() => {
    onEdit(transaction)
    swipeableRef.current?.close()
  }, [onEdit, transaction])

  const handleDelete = useCallback(() => {
    onDelete(transaction)
    swipeableRef.current?.close()
  }, [onDelete, transaction])

  // Render left actions (Edit) — slides in from left
  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-88, 0],
    })
    return (
      <Animated.View style={[styles.actionContainer, { transform: [{ translateX: trans }] }]}>
        <Pressable
          onPress={handleEdit}
          style={[
            styles.actionButton,
            {
              backgroundColor: '#6C63FF',
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
            },
          ]}
        >
          <Pencil size={26} color="#FFFFFF" />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
      </Animated.View>
    )
  }

  // Render right actions (Delete) — slides in from right
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [88, 0],
    })
    return (
      <Animated.View style={[styles.actionContainer, { transform: [{ translateX: trans }] }]}>
        <Pressable
          onPress={handleDelete}
          style={[
            styles.actionButton,
            {
              backgroundColor: '#FF6B6B',
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
            },
          ]}
        >
          <Trash2 size={26} color="#FFFFFF" />
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </Animated.View>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
      containerStyle={{ marginBottom: 8 }}
    >
      <View
        style={{
          backgroundColor: isDark ? '#1A1928' : '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CategoryIcon category={transaction.category} isDark={isDark} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: isDark ? '#FFFFFF' : '#1A1A2E', fontSize: 15, fontWeight: '600', marginBottom: 2 }}>
            {transaction.description || transaction.category}
          </Text>
          <Text style={{ color: isDark ? '#8888AA' : '#6B7280', fontSize: 12 }}>
            {transaction.category.toUpperCase()} • {formatTransactionDate(transaction.date)}
          </Text>
        </View>
        <Text style={{
          color: transaction.type === 'income' ? '#00C9A7' : '#FF6B6B',
          fontSize: 16,
          fontWeight: '700',
        }}>
          {transaction.type === 'income' ? '+' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
        </Text>
      </View>
    </Swipeable>
  )
}

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
    <View style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#2E2D45' : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  actionContainer: {
    width: 88,
    alignSelf: 'stretch',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
})
