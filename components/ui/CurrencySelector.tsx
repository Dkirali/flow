import { View, Text, Pressable, Modal, TextInput } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useState, useMemo } from 'react'
import { X, Search, Check } from 'lucide-react-native'
import { currencies, CurrencyCode, getCurrencyByCode } from '@/constants/currencies'

interface CurrencySelectorProps {
  visible: boolean
  selectedCode: string
  onSelect: (code: string) => void
  onClose: () => void
}

export function CurrencySelector({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: CurrencySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery) return currencies
    const query = searchQuery.toLowerCase()
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const handleSelect = (code: string) => {
    onSelect(code)
    onClose()
    setSearchQuery('')
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="pt-14 px-6 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-text-primary text-xl font-bold">
              Select Currency
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <X size={24} color="#EEEEFF" />
            </Pressable>
          </View>

          <Text className="text-text-secondary mb-4">
            Choose your primary income currency
          </Text>

          <View className="bg-surface-input border border-divider rounded-16 px-4 py-3 flex-row items-center gap-3">
            <Search size={20} color="#4A4A6A" />
            <TextInput
              className="flex-1 text-text-primary text-base"
              placeholder="Search currencies..."
              placeholderTextColor="#4A4A6A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        </View>

        <FlashList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item.code)}
              className="flex-row items-center px-6 py-4 border-b border-divider"
            >
              <Text className="text-2xl mr-4">{item.flag}</Text>

              <View className="flex-1">
                <Text className="text-text-primary font-semibold text-base">
                  {item.code}
                </Text>
                <Text className="text-text-secondary text-sm">
                  {item.name}
                </Text>
              </View>

              {item.code === selectedCode && (
                <View className="w-8 h-8 bg-purple rounded-full items-center justify-center">
                  <Check size={18} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          )}
          estimatedItemSize={56}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </Modal>
  )
}
