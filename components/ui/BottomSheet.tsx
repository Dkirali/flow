import { View, Pressable, Dimensions } from 'react-native'
import { ReactNode, useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

interface BottomSheetProps {
  isVisible: boolean
  onClose: () => void
  children: ReactNode
  snapPoint?: 'half' | 'full'
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export function BottomSheet({ isVisible, onClose, children, snapPoint = 'half' }: BottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT)
  const snapHeight = snapPoint === 'full' ? SCREEN_HEIGHT * 0.9 : SCREEN_HEIGHT * 0.5

  // Update position when visibility changes
  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(SCREEN_HEIGHT - snapHeight, {
        damping: 20,
        stiffness: 90,
      })
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 20,
        stiffness: 90,
      })
    }
  }, [isVisible, snapHeight])

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = SCREEN_HEIGHT - snapHeight + event.translationY
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        // Dismiss if dragged down enough
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 20,
          stiffness: 90,
        })
        onClose()
      } else {
        // Snap back
        translateY.value = withSpring(SCREEN_HEIGHT - snapHeight, {
          damping: 20,
          stiffness: 90,
        })
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: isVisible ? 0.7 : 0,
    pointerEvents: isVisible ? 'auto' : 'none',
  }))

  if (!isVisible) return null

  return (
    <View className="absolute inset-0 z-50">
      {/* Dark overlay */}
      <Animated.View
        className="absolute inset-0 bg-black"
        style={overlayStyle}
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          className="absolute left-0 right-0 bg-surface rounded-t-[20px]"
          style={[
            { height: snapHeight, top: 0 },
            animatedStyle,
          ]}
        >
          {/* Drag handle */}
          <View className="items-center pt-3 pb-4">
            <View className="w-9 h-1 bg-divider rounded-full" />
          </View>

          {/* Content */}
          <View className="flex-1 px-6">
            {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}
