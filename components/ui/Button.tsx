import { Pressable, Text, View } from 'react-native'
import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onPress: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
}

export function Button({
  children,
  onPress,
  disabled = false,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  const baseStyles = 'h-14 rounded-28 items-center justify-center flex-row gap-2'
  
  const variantStyles = {
    primary: disabled ? 'bg-element-inactive' : 'bg-purple',
    secondary: 'bg-surface border border-divider',
    ghost: 'bg-transparent',
  }

  const textStyles = {
    primary: 'text-white font-semibold text-lg',
    secondary: 'text-text-primary font-semibold text-lg',
    ghost: 'text-text-secondary font-medium',
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {typeof children === 'string' ? (
        <Text className={textStyles[variant]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
