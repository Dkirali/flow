import { View, Text, Pressable, Animated } from 'react-native'
import { useState, useRef, useEffect } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUserStore } from '@/stores/userStore'
import { ProgressDots } from '@/components/onboarding/ProgressDots'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { db } from '@/db/client'
import { settings } from '@/db/schema'
import { Sparkles } from 'lucide-react-native'

export default function OnboardingNameScreen() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { setName: setStoreName } = useUserStore()
  
  const shakeAnimation = useRef(new Animated.Value(0)).current
  const pulseAnimation = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      shakeInput()
      return
    }

    setIsLoading(true)
    
    try {
      setStoreName(name.trim())
      
      await db.insert(settings).values({
        key: 'user_name',
        value: name.trim(),
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: name.trim() },
      })

      router.push('/(onboarding)/income')
    } catch (error) {
      console.error('Failed to save name:', error)
      shakeInput()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setStoreName('')
    await db.insert(settings).values({
      key: 'user_name',
      value: '',
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: '' },
    })
    router.push('/(onboarding)/income')
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-8">
        <View className="mb-12">
          <ProgressDots total={3} current={0} />
        </View>

        <View className="items-center mb-8">
          <Animated.View
            style={{ transform: [{ scale: pulseAnimation }] }}
            className="w-32 h-32 bg-surface rounded-full items-center justify-center relative"
          >
            <View className="absolute w-8 h-8 bg-purple/20 rounded-full top-2 right-4" />
            <View className="absolute w-6 h-6 bg-teal/20 rounded-full bottom-4 left-4" />
            <View className="absolute w-4 h-4 bg-purple/30 rounded-full top-8 left-6" />
            <View className="absolute w-5 h-5 bg-teal/30 rounded-full bottom-6 right-6" />
            
            <View className="w-20 h-20 bg-purple/10 rounded-full items-center justify-center">
              <Sparkles size={32} color="#6C63FF" />
            </View>
          </Animated.View>
        </View>

        <View className="items-center mb-4">
          <Text className="text-text-primary text-3xl font-bold text-center mb-3">
            Meet Your AI{'\n'}Money Brain
          </Text>
          
          <Text className="text-text-secondary text-center px-4 text-base">
            FLŌW learns your habits and helps you spend smarter every day
          </Text>
        </View>

        <View className="flex-1" />

        <Animated.View 
          className="mb-8"
          style={{ transform: [{ translateX: shakeAnimation }] }}
        >
          <Input
            label="What should we call you?"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </Animated.View>

        <Button
          onPress={handleContinue}
          disabled={name.length < 2 || isLoading}
        >
          {isLoading ? 'Loading...' : 'Continue →'}
        </Button>

        <Pressable
          className="mt-4 items-center py-2"
          onPress={handleSkip}
        >
          <Text className="text-text-muted">Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
