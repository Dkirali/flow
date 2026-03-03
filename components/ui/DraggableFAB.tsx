import { useState, useEffect, useRef, useCallback } from 'react'
import { View, Pressable, Dimensions, ActivityIndicator } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const FAB_SIZE = 56
const EDGE_PADDING = 24
const BOTTOM_TAB_HEIGHT = 80

function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke="#FFFFFF"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

interface DraggableFABProps {
  onPress: () => void
}

export default function DraggableFAB({ onPress }: DraggableFABProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const isMounted = useRef(true)

  // Safe default values
  const defaultX = SCREEN_WIDTH - FAB_SIZE - EDGE_PADDING
  const defaultY = SCREEN_HEIGHT - FAB_SIZE - BOTTOM_TAB_HEIGHT - EDGE_PADDING

  // Initialize with safe defaults
  const translateX = useSharedValue(defaultX)
  const translateY = useSharedValue(defaultY)
  const isDragging = useSharedValue(false)
  const startX = useSharedValue(0)
  const startY = useSharedValue(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Load position safely
  useEffect(() => {
    const loadPosition = async () => {
      try {
        const saved = await AsyncStorage.getItem('fab_position')
        if (saved && isMounted.current) {
          const parsed = JSON.parse(saved)
          const { x, y } = parsed
          
          // Validate values are numbers and within bounds
          if (
            typeof x === 'number' && 
            typeof y === 'number' && 
            !isNaN(x) && 
            !isNaN(y) &&
            x >= 0 && 
            x <= SCREEN_WIDTH - FAB_SIZE &&
            y >= 100 && // Stay below header
            y <= SCREEN_HEIGHT - FAB_SIZE - BOTTOM_TAB_HEIGHT
          ) {
            translateX.value = x
            translateY.value = y
          }
        }
      } catch {
        // Continue with defaults, don't crash
      } finally {
        if (isMounted.current) {
          setIsReady(true)
        }
      }
    }
    
    loadPosition()
  }, [])

  // Save position safely
  const savePosition = useCallback(async (x: number, y: number) => {
    try {
      // Validate before saving
      if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
        return
      }
      
      // Ensure values are within bounds
      const safeX = Math.max(EDGE_PADDING, Math.min(SCREEN_WIDTH - FAB_SIZE - EDGE_PADDING, x))
      const safeY = Math.max(EDGE_PADDING + 100, Math.min(SCREEN_HEIGHT - FAB_SIZE - BOTTOM_TAB_HEIGHT - EDGE_PADDING, y))
      
      await AsyncStorage.setItem('fab_position', JSON.stringify({ x: safeX, y: safeY }))
    } catch {
      // Don't crash, just don't save
    }
  }, [])

  // Safe edge snapping with bounds checking
  const snapToEdge = useCallback((x: number, y: number) => {
    // Ensure x and y are valid numbers
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      return { x: defaultX, y: defaultY }
    }

    const centerX = x + FAB_SIZE / 2
    const snapX = centerX < SCREEN_WIDTH / 2 
      ? EDGE_PADDING  // Snap to left
      : SCREEN_WIDTH - FAB_SIZE - EDGE_PADDING  // Snap to right

    const minY = EDGE_PADDING + 100 // Stay below header
    const maxY = SCREEN_HEIGHT - FAB_SIZE - BOTTOM_TAB_HEIGHT - EDGE_PADDING
    const snapY = Math.max(minY, Math.min(maxY, y))

    return { x: snapX, y: snapY }
  }, [])

  // Safe gesture handler
  const panGesture = Gesture.Pan()
    .minDistance(10) // Prevent accidental drags on taps
    .onStart(() => {
      if (!isMounted.current) return
      
      isDragging.value = true
      startX.value = translateX.value
      startY.value = translateY.value
      runOnJS(setIsPressed)(true)
    })
    .onUpdate((event) => {
      if (!isMounted.current) return
      
      // Prevent NaN values
      if (typeof event.translationX !== 'number' || typeof event.translationY !== 'number') return
      if (isNaN(event.translationX) || isNaN(event.translationY)) return
      
      translateX.value = startX.value + event.translationX
      translateY.value = startY.value + event.translationY
    })
    .onEnd(() => {
      if (!isMounted.current) return
      
      isDragging.value = false

      try {
        const snapped = snapToEdge(translateX.value, translateY.value)
        
        // Animate to snapped position
        translateX.value = withSpring(snapped.x, { damping: 15, stiffness: 150 })
        translateY.value = withSpring(snapped.y, { damping: 15, stiffness: 150 })

        // Save safely
        runOnJS(savePosition)(snapped.x, snapped.y)
      } catch {
      }
      
      runOnJS(setIsPressed)(false)
    })
    .onFinalize(() => {
      // Ensure cleanup happens even if gesture fails
      if (isMounted.current) {
        isDragging.value = false
        runOnJS(setIsPressed)(false)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isDragging.value ? 1.1 : 1) },
    ],
  }))

  const handlePress = () => {
    if (!isDragging.value && isMounted.current) {
      onPress()
    }
  }

  // Show fallback static FAB if error occurred
  if (hasError) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          position: 'absolute',
          right: 24,
          bottom: 100,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: '#6C63FF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#00C9A7',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <PlusIcon />
      </Pressable>
    )
  }

  if (!isReady) {
    return (
      <View
        style={{
          position: 'absolute',
          right: 24,
          bottom: 100,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: '#6C63FF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#FFFFFF" size="small" />
      </View>
    )
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: FAB_SIZE,
            height: FAB_SIZE,
            left: 0,
            top: 0,
          },
          animatedStyle,
        ]}
      >
        <Pressable
          onPress={handlePress}
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            backgroundColor: '#6C63FF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#00C9A7',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isPressed ? 0.7 : 0.5,
            shadowRadius: isPressed ? 15 : 10,
            elevation: 8,
          }}
        >
          {/* Outer ring */}
          <View
            style={{
              position: 'absolute',
              width: FAB_SIZE + 8,
              height: FAB_SIZE + 8,
              borderRadius: (FAB_SIZE + 8) / 2,
              borderWidth: 2,
              borderColor: '#00C9A7',
              opacity: 0.3,
            }}
          />

          {/* Plus icon */}
          <PlusIcon />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  )
}
