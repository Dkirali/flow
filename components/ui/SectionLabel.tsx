import { Text } from 'react-native'

interface SectionLabelProps {
  children: string
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <Text className="text-[11px] font-semibold uppercase text-text-secondary tracking-[1.5px]">
      {children}
    </Text>
  )
}
