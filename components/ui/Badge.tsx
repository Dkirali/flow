import { Text, View } from 'react-native'

type BadgeVariant = 'leisure' | 'mandatory' | 'income' | 'recurring'

interface BadgeProps {
  label: string
  variant: BadgeVariant
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  leisure: { bg: 'bg-coral/12', text: 'text-coral' },
  mandatory: { bg: 'bg-purple/12', text: 'text-purple' },
  income: { bg: 'bg-teal/12', text: 'text-teal' },
  recurring: { bg: 'bg-purple/12', text: 'text-purple' },
}

export function Badge({ label, variant }: BadgeProps) {
  const styles = variantStyles[variant]

  return (
    <View className={`h-5 px-2 rounded-[10px] items-center justify-center ${styles.bg}`}>
      <Text className={`text-[10px] font-semibold uppercase ${styles.text}`}>
        {label}
      </Text>
    </View>
  )
}
