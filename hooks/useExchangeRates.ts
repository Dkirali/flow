import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSettingsStore } from '@/stores/settingsStore'

interface ExchangeRateCache {
  baseCurrency: string
  rates: Record<string, number>
  timestamp: string
}

const CACHE_KEY = 'exchange_rates_cache'

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currency: baseCurrency } = useSettingsStore()

  const fetchRates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check cache first
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed: ExchangeRateCache = JSON.parse(cached)
        const cacheDate = new Date(parsed.timestamp).toDateString()
        const today = new Date().toDateString()

        if (cacheDate === today && parsed.baseCurrency === baseCurrency) {
          setRates(parsed.rates)
          setIsLoading(false)
          return
        }
      }

      // Fetch fresh rates from free API
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates')
      }

      const data = await response.json()

      // Save to cache
      const cacheData: ExchangeRateCache = {
        baseCurrency,
        rates: data.rates,
        timestamp: new Date().toISOString(),
      }
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))

      setRates(data.rates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to cached rates even if expired
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed: ExchangeRateCache = JSON.parse(cached)
        setRates(parsed.rates)
      }
    } finally {
      setIsLoading(false)
    }
  }, [baseCurrency])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const convertToBase = useCallback((amount: number, fromCurrency: string): number => {
    if (!rates || fromCurrency === baseCurrency) return amount
    const rate = rates[fromCurrency]
    if (!rate) return amount
    return amount / rate
  }, [rates, baseCurrency])

  return {
    rates,
    isLoading,
    error,
    convertToBase,
    refetch: fetchRates,
  }
}
