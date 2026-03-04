import '../global.css'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState, useRef } from 'react'
import { View, Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { runMigrations, db } from '@/db/client'
import { transactions, incomeSources, mandatoryExpenses } from '@/db/schema'
import { useTransactionStore } from '@/stores/transactionStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { useUserStore } from '@/stores/userStore'
import { processRecurringTransactions } from '@/utils/recurringEngine'

// Bump this string to trigger a one-time wipe of all user data on next launch.
const RESET_VERSION = '3'

function RootLayoutNav() {
  const { fetchAll } = useTransactionStore()
  const { fetchIncomeSources, fetchMandatoryExpenses, recalculate } = useBudgetStore()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasNavigated = useRef(false)

  useEffect(() => {
    const init = async () => {
      try {
        // 1. One-time data reset: clear AsyncStorage stores BEFORE hydration so
        //    zustand picks up clean defaults when it hydrates below.
        const resetVersion = await AsyncStorage.getItem('app_reset_version')
        const needsReset = resetVersion !== RESET_VERSION
        if (needsReset) {
          await AsyncStorage.multiRemove(['user-storage', 'settings-storage', 'budget-storage'])
        }

        // 2. Wait for userStore hydration (reads from AsyncStorage).
        //    Since we wiped storage above if needed, it will hydrate with defaults.
        await new Promise<void>((resolve) => {
          if (useUserStore.persist.hasHydrated()) {
            resolve()
          } else {
            const unsub = useUserStore.persist.onFinishHydration(() => {
              unsub()
              resolve()
            })
          }
        })

        // 3. Run database migrations (creates/alters tables)
        await runMigrations()

        // 4. If reset was needed, wipe all SQLite data now that tables exist.
        if (needsReset) {
          await db.delete(transactions)
          await db.delete(incomeSources)
          await db.delete(mandatoryExpenses)
          await AsyncStorage.setItem('app_reset_version', RESET_VERSION)
        }

        // 5. Load transactions from SQLite
        await fetchAll()

        // 6. Load budget data (income sources and mandatory expenses)
        await fetchIncomeSources()
        await fetchMandatoryExpenses()

        // 7. Recalculate daily budget
        await recalculate()

        // 8. Process recurring transactions
        await processRecurringTransactions()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsReady(true)
      }
    }

    init()
  }, [])

  // Route to the correct screen once everything is ready.
  useEffect(() => {
    if (!isReady || hasNavigated.current) return
    hasNavigated.current = true
    const { isOnboardingComplete } = useUserStore.getState()
    if (isOnboardingComplete) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(onboarding)')
    }
  }, [isReady])

  return (
    <>
      {/* Stack is always rendered so navigation context is available for router.replace */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F0E1A' },
        }}
      >
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* Loading / error overlay — sits on top until init finishes */}
      {!isReady && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#0F0E1A',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {error ? (
            <>
              <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                Failed to load app
              </Text>
              <Text style={{ color: '#8888AA', textAlign: 'center', paddingHorizontal: 24 }}>
                {error}
              </Text>
            </>
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
              Loading FLŌW...
            </Text>
          )}
        </View>
      )}
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0E1A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF' }}>Loading fonts...</Text>
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
