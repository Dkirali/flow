import { View, Text, Pressable, TextInput, Switch } from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { ProgressDots } from '@/components/onboarding/ProgressDots'
import { Button } from '@/components/ui/Button'
import { CurrencySelector } from '@/components/ui/CurrencySelector'
import { getCurrencyByCode } from '@/constants/currencies'
import { Wallet, ChevronDown, Calendar, Repeat } from 'lucide-react-native'

type PaydayOption = '1st' | '15th' | 'biweekly' | 'custom'

export default function OnboardingIncomeScreen() {
  const [amount, setAmount] = useState('')
  const [paydayOption, setPaydayOption] = useState<PaydayOption>('1st')
  const [isRecurring, setIsRecurring] = useState(true)
  const [showCurrencySelector, setShowCurrencySelector] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { currency, setCurrency, currencySymbol } = useSettingsStore()
  const { addIncomeSource, recalculate } = useBudgetStore()

  const currentCurrency = getCurrencyByCode(currency)

  const handleAmountChange = (text: string) => {
    // Allow only numbers and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    if (parts[1]?.length > 2) return
    setAmount(cleaned)
    setError('')
  }

  const formatAmount = (value: string): string => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const handleContinue = async () => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create income source
      let recurringDay = 1
      if (paydayOption === '15th') recurringDay = 15
      if (paydayOption === 'biweekly') {
        // For bi-weekly, use a default day (today or 1st)
        recurringDay = new Date().getDate()
      }

      await addIncomeSource({
        name: 'Monthly Income',
        amount: numericAmount,
        category: 'salary',
        isRecurring,
        recurringFrequency: paydayOption === 'biweekly' ? 'biweekly' : 'monthly',
        recurringDay,
        currencyCode: currency,
      })

      // Recalculate daily budget
      recalculate()

      // Navigate to notifications
      router.push('/(onboarding)/notifications')
    } catch (err) {
      console.error('Failed to save income:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <CurrencySelector
        visible={showCurrencySelector}
        selectedCode={currency}
        onSelect={setCurrency}
        onClose={() => setShowCurrencySelector(false)}
      />

      <View className="flex-1 px-6 pt-8">
        {/* Progress Dots */}
        <View className="mb-12">
          <ProgressDots total={3} current={1} />
        </View>

        {/* Wallet Icon */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-surface rounded-20 items-center justify-center relative">
            <View className="absolute w-8 h-8 bg-purple/20 rounded-full top-2 right-2" />
            <View className="absolute w-6 h-6 bg-teal/20 rounded-full bottom-2 left-2" />
            
            <View className="w-16 h-16 bg-purple/10 rounded-full items-center justify-center">
              <Wallet size={28} color="#6C63FF" />
            </View>
            
            <View className="absolute -top-1 -right-1 w-6 h-6 bg-teal rounded-full items-center justify-center">
              <Text className="text-white text-xs">↑</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <View className="items-center mb-8">
          <Text className="text-text-primary text-2xl font-bold text-center mb-2">
            What's your monthly income?
          </Text>
          
          <Text className="text-text-secondary text-center">
            We'll use this to calculate your daily budget
          </Text>
        </View>

        {/* Monthly Amount Input */}
        <View className="mb-6">
          <Text className="section-label mb-3">MONTHLY AMOUNT</Text>
          
          <View className="bg-surface rounded-16 flex-row items-center px-4 py-3">
            <Pressable
              onPress={() => setShowCurrencySelector(true)}
              className="flex-row items-center gap-2 bg-surface-input rounded-12 px-3 py-2 mr-4"
            >
              <Text className="text-xl">{currentCurrency.flag}</Text>
              <Text className="text-text-primary font-semibold">{currency}</Text>
              <ChevronDown size={16} color="#8888AA" />
            </Pressable>

            <TextInput
              className="flex-1 text-text-primary text-2xl font-bold"
              placeholder="0.00"
              placeholderTextColor="#4A4A6A"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {error ? (
            <Text className="text-coral text-sm mt-2">{error}</Text>
          ) : null}
        </View>

        {/* Payday Selection */}
        <View className="mb-6">
          <Text className="section-label mb-3">NEXT PAYDAY</Text>
          
          <View className="flex-row flex-wrap gap-3">
            {[
              { id: '1st', label: '1st of Month' },
              { id: '15th', label: '15th of Month' },
              { id: 'biweekly', label: 'Bi-weekly' },
              { id: 'custom', label: 'Custom' },
            ].map((option) => (
              <Pressable
                key={option.id}
                onPress={() => setPaydayOption(option.id as PaydayOption)}
                className={`flex-1 min-w-[45%] py-3 px-4 rounded-16 items-center ${
                  paydayOption === option.id
                    ? 'bg-purple'
                    : 'bg-surface border border-divider'
                }`}
              >
                <Text
                  className={
                    paydayOption === option.id
                      ? 'text-white font-semibold'
                      : 'text-text-primary font-semibold'
                  }
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recurring Toggle */}
        <View className="bg-surface rounded-16 px-4 py-4 flex-row items-center justify-between mb-8">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-purple/10 rounded-full items-center justify-center">
              <Repeat size={20} color="#6C63FF" />
            </View>
            
            <View>
              <Text className="text-text-primary font-medium">Repeat every month</Text>
              <Text className="text-text-muted text-xs">Auto-generate income entries</Text>
            </View>
          </View>

          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: '#2E2D45', true: '#00C9A7' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Continue Button */}
        <Button
          onPress={handleContinue}
          disabled={!amount || isLoading}
        >
          {isLoading ? 'Saving...' : 'Continue →'}
        </Button>
      </View>
    </SafeAreaView>
  )
}
