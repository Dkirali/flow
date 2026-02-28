import { TextInput, View, Text } from 'react-native'

interface InputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  autoFocus?: boolean
  keyboardType?: 'default' | 'numeric' | 'email-address'
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  autoFocus = false,
  keyboardType = 'default',
}: InputProps) {
  return (
    <View>
      {label && (
        <Text className="text-text-secondary text-sm mb-3">{label}</Text>
      )}
      <TextInput
        className="bg-surface-input border border-divider rounded-16 px-4 py-4 text-text-primary text-lg"
        placeholder={placeholder}
        placeholderTextColor="#4A4A6A"
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        keyboardType={keyboardType}
      />
    </View>
  )
}
