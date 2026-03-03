import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  useColorScheme,
  Dimensions,
} from 'react-native'
import { useState, useEffect, useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { format, isToday } from 'date-fns'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Haptics from 'expo-haptics'
import { useTransactionStore } from '@/stores/transactionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { useExchangeRates } from '@/hooks/useExchangeRates'

import { getCategoriesByType, type Category } from '@/constants/categories'
import { getCurrencyByCode } from '@/constants/currencies'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import {
  X,
  Calendar,
  Clock,
  Check,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Laptop,
  TrendingUp,
  Store,
  Gift,
  Wallet,
  UtensilsCrossed,
  Car,
  Home,
  Film,
  ShoppingBag,
  Heart,
  BookOpen,
  FileText,
  Plane,
  MoreHorizontal,
  Repeat,
} from 'lucide-react-native'
import type { Transaction } from '@/types/transaction'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

// Icon component mapping
const ICON_COMPONENTS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Briefcase,
  Laptop,
  TrendingUp,
  Store,
  Gift,
  Wallet,
  UtensilsCrossed,
  Car,
  Home,
  Film,
  ShoppingBag,
  Heart,
  BookOpen,
  FileText,
  Plane,
  MoreHorizontal,
}

type TransactionType = 'income' | 'expense'
type RecurringFrequency = 'monthly' | 'weekly' | 'biweekly'

interface AddTransactionModalProps {
  visible: boolean
  onClose: () => void
  editTransaction?: Transaction
}

function getIconComponent(iconName: string) {
  return ICON_COMPONENTS[iconName] || MoreHorizontal
}

export function AddTransactionModal({
  visible,
  onClose,
  editTransaction,
}: AddTransactionModalProps) {
  const isEditMode = !!editTransaction
  const insets = useSafeAreaInsets()
  const systemScheme = useColorScheme()
  
  const { theme, accentColor, currency: baseCurrency } = useSettingsStore()
  const { addTransaction, updateTransaction } = useTransactionStore()
  const { recalculate } = useBudgetStore()
  const { rates, convertToBase } = useExchangeRates()
  
  const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark'
  
  // Form state
  const [type, setType] = useState<TransactionType>('income')
  const [amount, setAmount] = useState('')
  const [inputCurrency, setInputCurrency] = useState(baseCurrency)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())
  const [isMandatory, setIsMandatory] = useState(false)
  const [isLeisure, setIsLeisure] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly')
  const [description, setDescription] = useState('')
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showCurrencySelector, setShowCurrencySelector] = useState(false)
  const [btnPressed, setBtnPressed] = useState(false)

  // Colors
  const colors = {
    bg: isDark ? '#0A0A12' : '#FFFFFF',
    card: isDark ? '#13121F' : '#F5F5F5',
    text: isDark ? '#FFFFFF' : '#000000',
    subtext: isDark ? '#8888AA' : '#666666',
    border: isDark ? '#1A1928' : '#E0E0E0',
    accent: accentColor,
    income: '#00C9A7',
    expense: '#FF6B6B',
  }
  
  const baseCurrencySymbol = getCurrencyByCode(baseCurrency).symbol
  const inputCurrencySymbol = getCurrencyByCode(inputCurrency).symbol
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      if (isEditMode && editTransaction) {
        // Populate form for edit
        setType(editTransaction.type)
        setAmount(editTransaction.amount.toFixed(2))
        setInputCurrency(editTransaction.currencyCode || baseCurrency)
        
        const cats = getCategoriesByType(editTransaction.type)
        const cat = cats.find(c => c.name === editTransaction.category)
        setSelectedCategory(cat || null)
        
        setDate(new Date(editTransaction.date))
        if (editTransaction.time) {
          const [hours, minutes] = editTransaction.time.split(':')
          const timeDate = new Date()
          timeDate.setHours(parseInt(hours), parseInt(minutes))
          setTime(timeDate)
        } else {
          setTime(new Date())
        }
        
        setIsMandatory(editTransaction.isMandatory)
        setIsLeisure(editTransaction.isLeisure)
        setIsRecurring(editTransaction.isRecurring)
        setRecurringFrequency(editTransaction.recurringFrequency || 'monthly')
        setDescription(editTransaction.note || '')
      } else {
        // Reset for new transaction
        setType('income')
        setAmount('')
        setInputCurrency(baseCurrency)
        setSelectedCategory(null)
        setDate(new Date())
        setTime(new Date())
        setIsMandatory(false)
        setIsLeisure(false)
        setIsRecurring(false)
        setRecurringFrequency('monthly')
        setDescription('')
      }
    }
  }, [visible, editTransaction, isEditMode, baseCurrency])
  
  // Format amount display with commas
  const displayAmount = useMemo(() => {
    if (!amount) return ''
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [amount])
  
  // Convert to base currency
  const convertedAmount = useMemo(() => {
    if (!amount || !rates) return 0
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return 0
    return convertToBase(num, inputCurrency)
  }, [amount, inputCurrency, rates, convertToBase])
  
  // Handle amount input
  const handleAmountChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setAmount(cleaned)
  }
  
  // Toggle handlers (mutually exclusive)
  const handleMandatoryToggle = (value: boolean) => {
    setIsMandatory(value)
    if (value) setIsLeisure(false)
  }
  
  const handleLeisureToggle = (value: boolean) => {
    setIsLeisure(value)
    if (value) setIsMandatory(false)
  }
  
  // Date/Time format helpers
  const formatDateChip = () => {
    if (isToday(date)) return 'Today'
    return format(date, 'MMM dd')
  }
  
  const formatTimeChip = () => {
    return format(time, 'HH:mm')
  }
  
  // Submit handler
  const handleSubmit = async () => {
    // Silent validation - do nothing if invalid
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0 || !selectedCategory) {
      return
    }
    
    try {
      const transactionData = {
        amount: convertedAmount || numAmount,
        type,
        category: selectedCategory.name,
        note: description.trim() || undefined,
        date: format(date, 'yyyy-MM-dd'),
        time: format(time, 'HH:mm'),
        isMandatory: type === 'expense' ? isMandatory : false,
        isLeisure: type === 'expense' ? isLeisure : false,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        recurringDay: isRecurring && recurringFrequency === 'monthly' ? date.getDate() : undefined,
        currencyCode: baseCurrency,
      }
      
      if (isEditMode && editTransaction) {
        await updateTransaction(editTransaction.id, transactionData)
      } else {
        await addTransaction(transactionData)
      }
      
      // Recalculate budget
      recalculate()
      
      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      // Close modal
      onClose()
    } catch (error) {
    }
  }
  
  const categories = getCategoriesByType(type)
  
  const sheetHeight = WINDOW_HEIGHT * 0.95
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Backdrop */}
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
          }}
          onPress={onClose}
        />
        
        {/* Sheet */}
        <View
          style={{
            height: sheetHeight,
            backgroundColor: colors.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 20,
            }}
          >
            <View style={{ width: 40 }} />
            <Text
              style={{
                color: colors.text,
                fontSize: 20,
                fontWeight: '700',
              }}
            >
              {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={24} color={colors.subtext} />
            </Pressable>
          </View>
          
          {/* Form Content */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}
          >
            {/* Income/Expense Toggle */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.card,
                borderRadius: 50,
                padding: 6,
                marginBottom: 24,
              }}
            >
              <Pressable
                onPress={() => {
                  setType('income')
                  setSelectedCategory(null)
                  setIsMandatory(false)
                  setIsLeisure(false)
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 50,
                  alignItems: 'center',
                  backgroundColor: type === 'income' ? colors.income : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: type === 'income' ? '#0A0A12' : colors.subtext,
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  Income
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => {
                  setType('expense')
                  setSelectedCategory(null)
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 50,
                  alignItems: 'center',
                  backgroundColor: type === 'expense' ? colors.expense : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: type === 'expense' ? '#0A0A12' : colors.subtext,
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  Expense
                </Text>
              </Pressable>
            </View>
            
            {/* Amount Card */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 24,
                padding: 12,
                marginBottom: 24,
                alignItems: 'center',
              }}
            >
              {/* Currency Selector */}
              <Pressable
                onPress={() => setShowCurrencySelector(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1A1928' : '#E0E0E0',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  marginBottom: 16,
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    color: colors.subtext,
                    fontSize: 12,
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}
                >
                  {inputCurrency}
                </Text>
                <ChevronDown size={14} color={colors.subtext} />
              </Pressable>
              
              {/* Amount Input */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 4,
                width: '100%',
              }}>
                <Text
                  style={{
                    color: colors.subtext,
                    fontSize: 32,
                    fontWeight: '400',
                  }}
                >
                  {inputCurrencySymbol}
                </Text>
                <TextInput
                  style={{
                    color: colors.text,
                    fontSize: 42,
                    fontWeight: '700',
                    letterSpacing: -2,

                    textAlign: 'center',
                  }}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#2E2D45' : '#CCCCCC'}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                />
              </View>
              
              {/* Conversion display */}
              {convertedAmount > 0 && inputCurrency !== baseCurrency && (
                <Text
                  style={{
                    color: colors.subtext,
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  = {baseCurrencySymbol}
                  {convertedAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              )}
            </View>
            
            {/* Date/Time Chips */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.card,
                  borderRadius: 50,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Calendar size={16} color={colors.income} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {formatDateChip()}
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.card,
                  borderRadius: 50,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                }}
              >
                <Clock size={16} color={colors.income} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                >
                  {formatTimeChip()}
                </Text>
              </Pressable>
            </View>
            
            {/* Category Section */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.subtext,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 2,
                  marginBottom: 12,
                }}
              >
                CATEGORY
              </Text>
              
              {/* Category Trigger */}
              <Pressable
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderBottomLeftRadius: showCategoryDropdown ? 0 : 24,
                  borderBottomRightRadius: showCategoryDropdown ? 0 : 24,
                  padding: 18,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {selectedCategory ? (
                    <>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: isDark ? '#2E2D45' : '#E0E0E0',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {(() => {
                          const Icon = getIconComponent(selectedCategory.icon)
                          return <Icon size={22} color={selectedCategory.color} />
                        })()}
                      </View>
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 17,
                          fontWeight: '600',
                        }}
                      >
                        {selectedCategory.name}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ color: colors.subtext, fontSize: 17 }}>
                      Select a category
                    </Text>
                  )}
                </View>
                {showCategoryDropdown ? (
                  <ChevronUp size={20} color={colors.subtext} />
                ) : (
                  <ChevronDown size={20} color={colors.subtext} />
                )}
              </Pressable>
              
              {/* Category List */}
              {showCategoryDropdown && (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                    overflow: 'hidden',
                  }}
                >
                  {categories.map((cat, index) => {
                    const isSelected = selectedCategory?.id === cat.id
                    const Icon = getIconComponent(cat.icon)
                    
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          setSelectedCategory(cat)
                          setShowCategoryDropdown(false)
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 18,
                          borderTopWidth: index > 0 ? 1 : 0,
                          borderTopColor: isDark ? '#1A1928' : '#E0E0E0',
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(0,201,167,0.08)'
                              : 'rgba(0,201,167,0.1)'
                            : 'transparent',
                        }}
                      >
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: isDark ? '#2E2D45' : '#E0E0E0',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon size={22} color={cat.color} />
                          </View>
                          <Text
                            style={{
                              color: isSelected ? colors.income : colors.text,
                              fontSize: 17,
                              fontWeight: isSelected ? '600' : '500',
                            }}
                          >
                            {cat.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: colors.income,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={16} color="#0A0A12" strokeWidth={3} />
                          </View>
                        )}
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </View>
            
            {/* Expense Options */}
            {type === 'expense' && (
              <View style={{ marginBottom: 24 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    Mandatory Expense
                  </Text>
                  <Pressable
                    onPress={() => handleMandatoryToggle(!isMandatory)}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: isMandatory ? '#6C63FF' : isDark ? '#2E2D45' : '#E0E0E0',
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF',
                        transform: [{ translateX: isMandatory ? 22 : 2 }],
                      }}
                    />
                  </Pressable>
                </View>
                
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    Leisure Expense
                  </Text>
                  <Pressable
                    onPress={() => handleLeisureToggle(!isLeisure)}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: isLeisure ? colors.income : isDark ? '#2E2D45' : '#E0E0E0',
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF',
                        transform: [{ translateX: isLeisure ? 22 : 2 }],
                      }}
                    />
                  </Pressable>
                </View>
              </View>
            )}
            
            {/* Recurring Section */}
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: isRecurring ? 12 : 0,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: isDark ? '#6C63FF20' : '#6C63FF10',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Repeat size={20} color="#6C63FF" />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                      Recurring Entry
                    </Text>
                    <Text
                      style={{
                        color: colors.subtext,
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      Auto-generate entries
                    </Text>
                  </View>
                </View>
                
                <Pressable
                  onPress={() => setIsRecurring(!isRecurring)}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: isRecurring ? '#FF9F43' : isDark ? '#2E2D45' : '#E0E0E0',
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: isRecurring ? 22 : 2 }],
                    }}
                  />
                </Pressable>
              </View>
              
              {isRecurring && (
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'biweekly', label: 'Bi-weekly' },
                    { id: 'monthly', label: 'Monthly' },
                  ].map((freq) => (
                    <Pressable
                      key={freq.id}
                      onPress={() => setRecurringFrequency(freq.id as RecurringFrequency)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 50,
                        backgroundColor:
                          recurringFrequency === freq.id
                            ? 'rgba(255,159,67,0.15)'
                            : isDark
                              ? '#1A1928'
                              : '#F0F0F0',
                        borderWidth: 1,
                        borderColor:
                          recurringFrequency === freq.id
                            ? 'rgba(255,159,67,0.4)'
                            : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          color: recurringFrequency === freq.id ? '#FF9F43' : colors.subtext,
                          fontSize: 13,
                          fontWeight: '700',
                        }}
                      >
                        {freq.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            
            {/* Description Input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                backgroundColor: colors.card,
                borderRadius: 24,
                paddingHorizontal: 18,
                paddingVertical: 16,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: colors.subtext, fontSize: 20,  }}>≡</Text>
              <TextInput
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 15,
                  minHeight: 40,
            
                }}
                placeholder="Add a description..."
                placeholderTextColor={isDark ? '#2E2D45' : '#CCCCCC'}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>
          
          {/* CTA Button */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32,
              backgroundColor: colors.bg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              zIndex: 100,
            }}
          >
            <Pressable
              onPress={handleSubmit}
              onPressIn={() => setBtnPressed(true)}
              onPressOut={() => setBtnPressed(false)}
              style={{
                backgroundColor: '#00C9A7',
                borderRadius: 50,
                height: 60,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
                shadowColor: '#00C9A7',
                shadowOffset: { width: 0, height: btnPressed ? 4 : 8 },
                shadowOpacity: btnPressed ? 0.3 : 0.5,
                shadowRadius: btnPressed ? 8 : 16,
                elevation: 10,
                transform: [{ scale: btnPressed ? 0.98 : 1 }],
              }}
            >
              <Check size={22} color="#0A0A12" strokeWidth={3} />
              <Text
                style={{
                  color: '#0A0A12',
                  fontSize: 18,
                  fontWeight: '700',
                }}
              >
                {isEditMode
                  ? 'Save Changes'
                  : type === 'income'
                    ? 'Add Income'
                    : 'Add Expense'}
              </Text>
            </Pressable>
          </View>
          
          {/* Date Picker */}
          {showDatePicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <Pressable
                style={{
                  flex: 1,
                  justifyContent: 'flex-end',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
                onPress={() => setShowDatePicker(false)}
              >
                <View style={{
                  backgroundColor: isDark ? '#1A1928' : '#FFFFFF',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: insets.bottom + 24,
                }}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    textColor={isDark ? '#FFFFFF' : '#000000'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) setDate(selectedDate)
                    }}
                    style={{ backgroundColor: 'transparent' }}
                  />
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    style={{
                      backgroundColor: '#6C63FF',
                      borderRadius: 16,
                      height: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 8,
                    }}
                  >
                    <Text style={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: 16,
                    }}>
                      Done
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showTimePicker}
              onRequestClose={() => setShowTimePicker(false)}
            >
              <Pressable
                style={{
                  flex: 1,
                  justifyContent: 'flex-end',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
                onPress={() => setShowTimePicker(false)}
              >
                <View style={{
                  backgroundColor: isDark ? '#1A1928' : '#FFFFFF',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: 24,
                  paddingBottom: insets.bottom + 24,
                }}>
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="spinner"
                    textColor={isDark ? '#FFFFFF' : '#000000'}
                    themeVariant={isDark ? 'dark' : 'light'}
                    onChange={(event, selectedTime) => {
                      if (selectedTime) setTime(selectedTime)
                    }}
                    style={{ backgroundColor: 'transparent' }}
                  />
                  <Pressable
                    onPress={() => setShowTimePicker(false)}
                    style={{
                      backgroundColor: '#6C63FF',
                      borderRadius: 16,
                      height: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 8,
                    }}
                  >
                    <Text style={{
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: 16,
                    }}>
                      Done
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>
          )}
          
          {/* Currency Selector Modal */}
          <CurrencySelector
            visible={showCurrencySelector}
            selectedCode={inputCurrency}
            onSelect={setInputCurrency}
            onClose={() => setShowCurrencySelector(false)}
          />
        </View>
      </View>
    </Modal>
  )
}
