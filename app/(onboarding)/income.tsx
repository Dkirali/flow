import { 
  View, Text, Pressable, TextInput, 
  Switch, TouchableWithoutFeedback, 
  Keyboard, ScrollView, Modal
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import { getCurrencyByCode } from '@/constants/currencies'
import { ChevronDown, Repeat } from 'lucide-react-native'

type PaydayOption = '1st' | '15th' | 'last' | 'custom'

function ProgressDots({ 
  total, 
  current 
}: { 
  total: number
  current: number 
}) {
  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8 
    }}>
      {Array.from({ length: total }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => {
            if (index === 0) 
              router.push('/(onboarding)/')
            if (index === 1) 
              router.push('/(onboarding)/income')
            if (index === 2) 
              router.push('/(onboarding)/notifications')
          }}
          style={{
            width: index === current ? 32 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: index === current 
              ? '#6C63FF' 
              : '#2E2D45',
          }}
        />
      ))}
    </View>
  )
}

function DayPickerModal({ 
  visible, 
  selectedDay,
  onSelect, 
  onClose 
}: { 
  visible: boolean
  selectedDay: number | null
  onSelect: (day: number) => void
  onClose: () => void 
}) {
  const days = Array.from(
    { length: 28 }, 
    (_, i) => i + 1
  )
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable 
        style={{
          flex: 1,
          backgroundColor: '#000000AA',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={{
            backgroundColor: '#1A1928',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 48,
          }}>
            {/* Handle bar */}
            <View style={{
              width: 40,
              height: 4,
              backgroundColor: '#2E2D45',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 20,
            }} />

            <Text style={{
              color: '#EEEEFF',
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 6,
            }}>
              Select Payday
            </Text>
            <Text style={{
              color: '#8888AA',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 24,
            }}>
              Choose which day of the month 
              you get paid
            </Text>

            {/* Day grid */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
            }}>
              {days.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => {
                    onSelect(day)
                    onClose()
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 
                      selectedDay === day 
                        ? '#6C63FF' 
                        : '#13121F',
                    borderWidth: 1,
                    borderColor: 
                      selectedDay === day 
                        ? '#6C63FF' 
                        : '#2E2D45',
                  }}
                >
                  <Text style={{
                    color: selectedDay === day 
                      ? '#FFFFFF' 
                      : '#8888AA',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Cancel */}
            <Pressable
              onPress={onClose}
              style={{ 
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              <Text style={{ 
                color: '#4A4A6A',
                fontSize: 15,
              }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function WalletIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Wallet body */}
      <Rect 
        x={8} y={20} 
        width={48} height={34} 
        rx={8} 
        fill="#6C63FF" 
        opacity={0.15} 
      />
      <Rect 
        x={8} y={20} 
        width={48} height={34} 
        rx={8} 
        fill="none"
        stroke="#6C63FF" 
        strokeWidth={1.5}
      />
      {/* Wallet flap */}
      <Rect 
        x={8} y={14} 
        width={36} height={16} 
        rx={6} 
        fill="#6C63FF"
        opacity={0.2}
      />
      <Rect 
        x={8} y={14} 
        width={36} height={16} 
        rx={6} 
        fill="none"
        stroke="#6C63FF" 
        strokeWidth={1.5}
      />
      {/* Coin slot */}
      <Rect 
        x={38} y={32} 
        width={14} height={10} 
        rx={5} 
        fill="#6C63FF"
        opacity={0.3}
      />
      <Circle 
        cx={45} cy={37} 
        r={3} 
        fill="#6C63FF" 
      />
      {/* Up arrow */}
      <Path 
        d="M32 10 L32 20 M28 14 L32 10 L36 14"
        stroke="#00C9A7"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export default function OnboardingIncomeScreen() {
  const [amount, setAmount] = useState('')
  const [paydayOption, setPaydayOption] = 
    useState<PaydayOption>('1st')
  const [isRecurring, setIsRecurring] = useState(true)
  const [showCurrencySelector, setShowCurrencySelector] = 
    useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDay, setCustomDay] = useState<number | null>(null)

  const { currency, setCurrency } = useSettingsStore()
  const { addIncomeSource, recalculate } = useBudgetStore()
  const currentCurrency = getCurrencyByCode(currency)

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setAmount(cleaned)
    setError('')
  }

  const handleContinue = async () => {
    const numericAmount = parseFloat(amount)
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    try {
      await addIncomeSource({
        name: 'Monthly Income',
        amount: numericAmount,
        category: 'salary',
        isRecurring,
        recurringFrequency: 'monthly',
        recurringDay: 
          paydayOption === '15th' ? 15 :
          paydayOption === 'last' ? 31 :
          paydayOption === 'custom' && customDay 
            ? customDay : 1,
        currencyCode: currency,
      })
      recalculate()
      router.push('/(onboarding)/notifications')
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/(onboarding)/notifications')
  }

  const paydayOptions = [
    { id: '1st', label: '1st of Month' },
    { id: '15th', label: '15th of Month' },
    { id: 'last', label: 'Last Day' },
    { id: 'custom', label: 'Custom Date' },
  ]

  return (
    <TouchableWithoutFeedback 
      onPress={Keyboard.dismiss} 
      accessible={false}
    >
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: '#0F0E1A' 
      }}>
        <CurrencySelector
          visible={showCurrencySelector}
          selectedCode={currency}
          onSelect={setCurrency}
          onClose={() => setShowCurrencySelector(false)}
        />

        <DayPickerModal
          visible={showCalendar}
          selectedDay={customDay}
          onSelect={(day) => {
            setCustomDay(day)
            setShowCalendar(false)
          }}
          onClose={() => setShowCalendar(false)}
        />

        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ 
            flex: 1, 
            paddingHorizontal: 24 
          }}>

            {/* Progress dots — clickable */}
            <View style={{ 
              alignItems: 'center', 
              paddingTop: 16,
              paddingBottom: 24,
            }}>
              <ProgressDots total={3} current={1} />
            </View>

            {/* Wallet icon */}
            <View style={{ 
              alignItems: 'center', 
              marginBottom: 24 
            }}>
              <View style={{
                width: 96,
                height: 96,
                backgroundColor: '#1A1928',
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WalletIcon />
              </View>
            </View>

            {/* Title */}
            <View style={{ 
              alignItems: 'center', 
              marginBottom: 28 
            }}>
              <Text style={{
                fontSize: 26,
                fontWeight: '800',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8,
                lineHeight: 32,
              }}>
                What's your monthly income?
              </Text>
              <Text style={{
                fontSize: 15,
                color: '#8888AA',
                textAlign: 'center',
              }}>
                We'll use this to calculate your daily budget
              </Text>
            </View>

            {/* Monthly Amount */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#8888AA',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1.5,
                marginBottom: 10,
              }}>
                MONTHLY AMOUNT
              </Text>

              <View style={{
                backgroundColor: '#1A1928',
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderWidth: isFocused ? 2 : 0,
                borderColor: '#6C63FF',
              }}>
                <Pressable
                  onPress={() => setShowCurrencySelector(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#13121F',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>
                    {currentCurrency?.flag ?? '🌐'}
                  </Text>
                  <Text style={{
                    color: '#EEEEFF',
                    fontWeight: '600',
                    fontSize: 14,
                  }}>
                    {currency}
                  </Text>
                  <ChevronDown size={14} color="#8888AA" />
                </Pressable>

                <TextInput
                  style={{
                    flex: 1,
                    color: '#EEEEFF',
                    fontSize: 24,
                    fontWeight: '700',
                    paddingVertical: 14,
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#4A4A6A"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              {error ? (
                <Text style={{ 
                  color: '#FF6B6B', 
                  fontSize: 13, 
                  marginTop: 6,
                  paddingLeft: 4,
                }}>
                  {error}
                </Text>
              ) : null}
            </View>

            {/* Payday Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#8888AA',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1.5,
                marginBottom: 10,
              }}>
                NEXT PAYDAY
              </Text>

              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                gap: 10 
              }}>
                {paydayOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      setPaydayOption(option.id as PaydayOption)
                      if (option.id === 'custom') {
                        setShowCalendar(true)
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: '45%',
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      backgroundColor: 
                        paydayOption === option.id 
                          ? '#6C63FF' 
                          : '#1A1928',
                      borderWidth: paydayOption === option.id 
                        ? 0 : 1,
                      borderColor: '#2E2D45',
                    }}
                  >
                    <Text style={{
                      color: paydayOption === option.id 
                        ? '#FFFFFF' 
                        : '#8888AA',
                      fontWeight: '600',
                      fontSize: 14,
                    }}>
                      {option.id === 'custom' && customDay
                        ? `Day ${customDay}`
                        : option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recurring Toggle */}
            <View style={{
              backgroundColor: '#1A1928',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 32,
            }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 12 
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#6C63FF20',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Repeat size={20} color="#6C63FF" />
                </View>
                <View>
                  <Text style={{ 
                    color: '#EEEEFF', 
                    fontWeight: '600',
                    fontSize: 15,
                  }}>
                    Repeat every month
                  </Text>
                  <Text style={{ 
                    color: '#8888AA', 
                    fontSize: 12,
                    marginTop: 2,
                  }}>
                    Auto-generate income entries
                  </Text>
                </View>
              </View>

              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ 
                  false: '#2E2D45', 
                  true: '#00C9A7' 
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Continue Button */}
            <Pressable
              onPress={handleContinue}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                isLoading
              }
              style={{
                backgroundColor: amount && !isLoading 
                  ? '#6C63FF' 
                  : '#6C63FF50',
                borderRadius: 28,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6C63FF',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '600',
              }}>
                {isLoading ? 'Saving...' : 'Continue →'}
              </Text>
            </Pressable>

            {/* Skip button */}
            <Pressable
              onPress={handleSkip}
              style={{ 
                alignItems: 'center', 
                paddingVertical: 16,
                marginBottom: 8,
              }}
            >
              <Text style={{ 
                color: '#4A4A6A', 
                fontSize: 15,
              }}>
                Skip for now
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}
