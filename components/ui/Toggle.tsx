import { Switch, View } from 'react-native'

interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
}

export function Toggle({ value, onValueChange }: ToggleProps) {
  return (
    <View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#2E2D45', true: '#00C9A7' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#2E2D45"
      />
    </View>
  )
}
