import { useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function useCurrencyFormatter() {
  const currencyCode = useSettingsStore((state) => state.currency)

  const formatCurrency = useCallback(
    (amount: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
      }).format(amount)
    },
    [currencyCode]
  )

  const formatAmountWithoutSymbol = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Math.abs(amount))
    },
    []
  )

  return {
    formatCurrency,
    formatAmountWithoutSymbol,
  }
}
