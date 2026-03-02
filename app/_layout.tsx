import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { runMigrations } from '@/db/client'
import { useTransactionStore } from '@/stores/transactionStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { processRecurringTransactions } from '@/utils/recurringEngine'

function RootLayoutNav() {
  const { fetchAll } = useTransactionStore()
  const { fetchIncomeSources, fetchMandatoryExpenses, recalculate } = useBudgetStore()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Run database migrations
        await runMigrations()
        
        // 2. Load transactions from SQLite
        await fetchAll()
        
        // 3. Load budget data (income sources and mandatory expenses)
        await fetchIncomeSources()
        await fetchMandatoryExpenses()
        
        // 4. Recalculate daily budget
        recalculate()
        
        // 5. Process recurring transactions
        await processRecurringTransactions()
      } catch (err) {
        // Error will be set below
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsReady(true)
      }
    }

    init()
  }, [])

  // Show loading screen while initializing
  if (!isReady) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-primary text-lg font-semibold">Loading FLŌW...</Text>
      </View>
    )
  }

  // Show error if initialization failed
  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-coral text-lg font-semibold mb-2">Failed to load app</Text>
        <Text className="text-text-secondary text-center">{error}</Text>
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0E1A' },
      }}
    >
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  // 1. Load fonts
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
  })

  // 3. Hold splash screen until fonts are ready
  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-primary">Loading fonts...</Text>
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#0F0E1A' }}>
          <RootLayoutNav />
          <StatusBar style="light" />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}
