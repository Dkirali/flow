import { View } from 'react-native'
import { Canvas, Path, Skia } from '@shopify/react-native-skia'
import { useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated'

interface ProgressRingProps {
  percentage: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 12,
  color = '#00C9A7',
}: ProgressRingProps) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(percentage, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    })
  }, [percentage])

  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Create SVG path for the ring
  const path = Skia.Path.Make()
  path.addCircle(center, center, radius)

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (progress.value / 100) * circumference
    return {
      strokeDashoffset,
    }
  })

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        {/* Background track */}
        <Path
          path={path}
          strokeWidth={strokeWidth}
          color="#2E2D45"
          style="stroke"
          strokeCap="round"
        />
        {/* Progress arc */}
        <Path
          path={path}
          strokeWidth={strokeWidth}
          color={color}
          style="stroke"
          strokeCap="round"
          strokeDasharray={circumference}
          // @ts-ignore - animated props work with Skia
          animatedProps={animatedProps}
        />
      </Canvas>
    </View>
  )
}
