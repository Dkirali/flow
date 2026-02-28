import { View, ViewProps } from 'react-native'

interface CardProps extends ViewProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-20 p-5 ${className}`}
      {...props}
    >
      {children}
    </View>
  )
}
