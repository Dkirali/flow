import { Pressable, Text, View } from 'react-native'
import { ReactNode } from 'react'

interface ChipProps {
  label: string
  icon?: ReactNode
  selected: boolean
  onPress: () => void
}

export function Chip({ label, icon, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center h-11 px-4 rounded-[22px] ${
        selected
          ? 'bg-purple'
          : 'bg-surface border-[1.5px] border-divider'
      }`}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text
        className={`font-semibold text-[15px] ${
          selected ? 'text-white' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}
