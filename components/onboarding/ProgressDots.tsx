import { View } from 'react-native'

interface ProgressDotsProps {
  total: number
  current: number
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View className="flex-row gap-2 items-center justify-center">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`rounded-full ${
            index === current
              ? 'w-8 h-2 bg-purple'
              : 'w-2 h-2 bg-element-inactive'
          }`}
        />
      ))}
    </View>
  )
}
