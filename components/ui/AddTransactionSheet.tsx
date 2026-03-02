import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useTransactionStore } from '@/stores/transactionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getCurrencyByCode } from '@/constants/currencies'

type TransactionType = 'income' | 'expense'
type ExpenseSubtype = 'mandatory' | 'leisure' | 'recurring'

interface Category {
  id: string
  label: string
  icon: string
}

const INCOME_CATEGORIES: Category[] = [
  { id: 'salary',      label: 'Salary',       icon: '💰' },
  { id: 'freelance',   label: 'Freelance',     icon: '💻' },
  { id: 'business',    label: 'Business',      icon: '🏢' },
  { id: 'investments', label: 'Investments',   icon: '📈' },
  { id: 'gift',        label: 'Gift',          icon: '🎁' },
  { id: 'other',       label: 'Other',         icon: '💼' },
]

const EXPENSE_CATEGORIES: Category[] = [
  { id: 'rent',          label: 'Rent / Mortgage', icon: '🏠' },
  { id: 'utilities',     label: 'Utilities',       icon: '🔌' },
  { id: 'groceries',     label: 'Groceries',       icon: '🛒' },
  { id: 'food_drink',    label: 'Food & Drink',     icon: '🍔' },
  { id: 'transport',     label: 'Transport',        icon: '🚗' },
  { id: 'shopping',      label: 'Shopping',         icon: '🛍️' },
  { id: 'entertainment', label: 'Entertainment',    icon: '🎬' },
  { id: 'health',        label: 'Health',           icon: '💊' },
  { id: 'travel',        label: 'Travel',           icon: '✈️' },
  { id: 'education',     label: 'Education',        icon: '📚' },
  { id: 'other',         label: 'Other',            icon: '⋯' },
]

const EXPENSE_SUBTYPES = [
  { id: 'mandatory' as const, label: 'Mandatory', icon: '🛡️' },
  { id: 'leisure'   as const, label: 'Leisure',   icon: '✨' },
  { id: 'recurring' as const, label: 'Recurring', icon: '🔄' },
]

interface AddTransactionSheetProps {
  visible: boolean
  onClose: () => void
}

export function AddTransactionSheet({ visible, onClose }: AddTransactionSheetProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [expenseSubtype, setExpenseSubtype] = useState<ExpenseSubtype>('mandatory')
  const [note, setNote] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { addTransaction } = useTransactionStore()
  const { currency } = useSettingsStore()
  const currencySymbol = getCurrencyByCode(currency)?.symbol ?? '$'

  const now = new Date()
  const timeLabel = format(now, 'h:mm a')
  const dateStr = format(now, 'yyyy-MM-dd')
  const timeStr = format(now, 'HH:mm')

  // Reset form every time the sheet opens
  useEffect(() => {
    if (visible) {
      setType('expense')
      setAmount('')
      setCategoryId('')
      setNote('')
      setExpenseSubtype('mandatory')
      setShowCategories(false)
      setIsLoading(false)
    }
  }, [visible])

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const selectedCategory = categories.find(c => c.id === categoryId)

  const handleTypeSwitch = (t: TransactionType) => {
    setType(t)
    setCategoryId('')
    setShowCategories(false)
  }

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setAmount(cleaned)
  }

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0 || !categoryId) return

    setIsLoading(true)
    try {
      await addTransaction({
        amount: numericAmount,
        type,
        category: selectedCategory?.label ?? categoryId,
        note: note.trim() || undefined,
        date: dateStr,
        time: timeStr,
        isMandatory: type === 'expense' && expenseSubtype === 'mandatory',
        isLeisure: type === 'expense' && expenseSubtype === 'leisure',
        isRecurring: expenseSubtype === 'recurring',
        currencyCode: currency,
      })
      onClose()
    } catch {
      // silently fail for now — toast/error state can be added later
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = parseFloat(amount) > 0 && !!categoryId
  const accentColor = type === 'income' ? '#00C9A7' : '#FF6B6B'
  const buttonColor = type === 'income' ? '#00C9A7' : '#6C63FF'
  const buttonLabel = isLoading
    ? 'Saving...'
    : type === 'income' ? 'Add Income' : 'Add Expense'
  const buttonIcon = type === 'income' ? '✓' : '−'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' }}>
          {/* Tap outside to close */}
          <Pressable style={{ flex: 1 }} onPress={onClose} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={{
              backgroundColor: '#13121F',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              maxHeight: '92%',
            }}>

              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 12 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#2E2D45' }} />
              </View>

              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                  Add Transaction
                </Text>
                <Pressable
                  onPress={onClose}
                  style={{
                    position: 'absolute',
                    right: 20,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#2E2D45',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#8888AA', fontSize: 15, lineHeight: 20 }}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
              >

                {/* Type Toggle */}
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: '#1A1928',
                  borderRadius: 28,
                  padding: 4,
                  marginBottom: 20,
                }}>
                  {(['income', 'expense'] as const).map(t => (
                    <Pressable
                      key={t}
                      onPress={() => handleTypeSwitch(t)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 24,
                        alignItems: 'center',
                        backgroundColor: type === t
                          ? (t === 'income' ? '#00C9A7' : '#FF6B6B')
                          : 'transparent',
                      }}
                    >
                      <Text style={{
                        color: type === t ? '#000000' : '#8888AA',
                        fontWeight: '700',
                        fontSize: 15,
                      }}>
                        {t === 'income' ? 'Income' : 'Expense'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Amount card */}
                <View style={{
                  backgroundColor: '#1A1928',
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 16,
                  alignItems: 'center',
                }}>
                  {/* Currency chip */}
                  <View style={{
                    backgroundColor: '#2E2D45',
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 16,
                  }}>
                    <Text style={{ color: '#EEEEFF', fontSize: 14, fontWeight: '600' }}>{currency}</Text>
                    <Text style={{ color: '#8888AA', fontSize: 11 }}>▾</Text>
                  </View>

                  {/* Amount input row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: accentColor, fontSize: 40, fontWeight: '700', marginRight: 2 }}>
                      {currencySymbol}
                    </Text>
                    <TextInput
                      style={{
                        color: '#FFFFFF',
                        fontSize: 40,
                        fontWeight: '700',
                        minWidth: 80,
                        textAlign: 'left',
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#4A4A6A"
                      value={amount}
                      onChangeText={handleAmountChange}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                  </View>
                  {/* Cursor underline */}
                  <View style={{ width: 48, height: 2, backgroundColor: accentColor, borderRadius: 1, marginTop: 6 }} />
                </View>

                {/* Date & Time chips */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: '#1A1928', borderRadius: 20,
                    paddingHorizontal: 14, paddingVertical: 10,
                  }}>
                    <Text style={{ fontSize: 13 }}>📅</Text>
                    <Text style={{ color: '#EEEEFF', fontSize: 14, fontWeight: '600' }}>Today</Text>
                  </View>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: '#1A1928', borderRadius: 20,
                    paddingHorizontal: 14, paddingVertical: 10,
                  }}>
                    <Text style={{ fontSize: 13 }}>🕐</Text>
                    <Text style={{ color: '#EEEEFF', fontSize: 14, fontWeight: '600' }}>{timeLabel}</Text>
                  </View>
                </View>

                {/* Transaction type chips — expense only */}
                {type === 'expense' && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{
                      color: '#8888AA', fontSize: 11, fontWeight: '700',
                      letterSpacing: 1.5, marginBottom: 10,
                    }}>
                      TRANSACTION TYPE
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {EXPENSE_SUBTYPES.map(st => (
                        <Pressable
                          key={st.id}
                          onPress={() => setExpenseSubtype(st.id)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            paddingVertical: 11,
                            borderRadius: 20,
                            backgroundColor: expenseSubtype === st.id ? '#6C63FF' : '#1A1928',
                            borderWidth: expenseSubtype === st.id ? 0 : 1,
                            borderColor: '#2E2D45',
                          }}
                        >
                          <Text style={{ fontSize: 12 }}>{st.icon}</Text>
                          <Text style={{
                            color: expenseSubtype === st.id ? '#FFFFFF' : '#8888AA',
                            fontSize: 12,
                            fontWeight: '600',
                          }}>
                            {st.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Category */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    color: '#8888AA', fontSize: 11, fontWeight: '700',
                    letterSpacing: 1.5, marginBottom: 10,
                  }}>
                    CATEGORY
                  </Text>

                  {/* Trigger */}
                  <Pressable
                    onPress={() => setShowCategories(prev => !prev)}
                    style={{
                      backgroundColor: '#1A1928',
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {selectedCategory ? (
                        <>
                          <View style={{
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: '#2E2D45',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Text style={{ fontSize: 18 }}>{selectedCategory.icon}</Text>
                          </View>
                          <Text style={{ color: '#EEEEFF', fontSize: 15, fontWeight: '600' }}>
                            {selectedCategory.label}
                          </Text>
                        </>
                      ) : (
                        <Text style={{ color: '#4A4A6A', fontSize: 15 }}>Select a category</Text>
                      )}
                    </View>
                    <Text style={{ color: '#8888AA', fontSize: 14 }}>
                      {showCategories ? '▴' : '▾'}
                    </Text>
                  </Pressable>

                  {/* Category list */}
                  {showCategories && (
                    <View style={{
                      backgroundColor: '#1A1928',
                      borderRadius: 16,
                      marginTop: 4,
                      overflow: 'hidden',
                    }}>
                      {categories.map((cat, index) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            setCategoryId(cat.id)
                            setShowCategories(false)
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            padding: 14,
                            borderBottomWidth: index < categories.length - 1 ? 1 : 0,
                            borderBottomColor: '#2E2D45',
                            backgroundColor: categoryId === cat.id ? '#2E2D45' : 'transparent',
                          }}
                        >
                          <View style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: '#2E2D45',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                          </View>
                          <Text style={{ color: '#EEEEFF', fontSize: 15, flex: 1 }}>{cat.label}</Text>
                          {categoryId === cat.id && (
                            <Text style={{ color: '#00C9A7', fontSize: 16 }}>✓</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Note — expense only */}
                {type === 'expense' && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{
                      color: '#8888AA', fontSize: 11, fontWeight: '700',
                      letterSpacing: 1.5, marginBottom: 10,
                    }}>
                      NOTE
                    </Text>
                    <View style={{
                      backgroundColor: '#1A1928',
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}>
                      <Text style={{ color: '#4A4A6A', fontSize: 18, marginTop: 1 }}>≡</Text>
                      <TextInput
                        style={{
                          flex: 1,
                          color: '#EEEEFF',
                          fontSize: 14,
                          minHeight: 36,
                        }}
                        placeholder="Add a description..."
                        placeholderTextColor="#4A4A6A"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </View>
                )}

                {/* Submit */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid || isLoading}
                  style={{
                    backgroundColor: isValid ? buttonColor : `${buttonColor}50`,
                    borderRadius: 28,
                    height: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 8,
                    shadowColor: buttonColor,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isValid ? 0.35 : 0,
                    shadowRadius: 16,
                    elevation: isValid ? 8 : 0,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>
                    {buttonIcon}
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                    {buttonLabel}
                  </Text>
                </Pressable>

              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
