import { View, Text, Switch, Pressable, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { ProgressDots } from '@/components/onboarding/ProgressDots'
import { Button } from '@/components/ui/Button'
import { Bell, BarChart3, CalendarDays, PartyPopper } from 'lucide-react-native'

interface NotificationToggle {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  enabled: boolean
  defaultValue: boolean
}

export default function OnboardingNotificationsScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  
  const { completeOnboarding } = useUserStore()
  const { 
    notifications, 
    setNotification 
  } = useSettingsStore()

  const [toggles, setToggles] = useState<NotificationToggle[]>([
    {
      id: 'dailyReminder',
      icon: <Bell size={20} color="#6C63FF" />,
      title: 'Daily Entry Reminder',
      subtitle: 'Remind me to log expenses',
      enabled: true,
      defaultValue: true,
    },
    {
      id: 'budgetAlert',
      icon: <BarChart3 size={20} color="#00C9A7" />,
      title: 'Budget Alert',
      subtitle: 'Notify me when nearing my daily limit',
      enabled: true,
      defaultValue: true,
    },
    {
      id: 'paydayReminder',
      icon: <CalendarDays size={20} color="#4A4A6A" />,
      title: 'Payday Reminder',
      subtitle: 'Alert me 2 days before payday',
      enabled: false,
      defaultValue: false,
    },
  ])

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync()
    setHasPermission(status === 'granted')
  }

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    setHasPermission(status === 'granted')
    
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'You can enable notifications later in Settings if you change your mind.',
        [{ text: 'OK' }]
      )
    }
    
    return status === 'granted'
  }

  const handleToggle = async (id: string, value: boolean) => {
    // If enabling and no permission, request it first
    if (value && !hasPermission) {
      const granted = await requestPermission()
      if (!granted) {
        // User denied permission, don't toggle
        return
      }
    }

    // Update local toggle state
    setToggles(prev =>
      prev.map(toggle =>
        toggle.id === id ? { ...toggle, enabled: value } : toggle
      )
    )

    // Update settings store
    setNotification(id as keyof typeof notifications, value)

    // Schedule notifications if enabled
    if (value) {
      await scheduleNotification(id)
    } else {
      await cancelNotification(id)
    }
  }

  const scheduleNotification = async (id: string) => {
    try {
      switch (id) {
        case 'dailyReminder':
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'FLŌW',
              body: "Don't forget to log today's expenses!",
            },
            trigger: {
              hour: 21,
              minute: 0,
              repeats: true,
            },
          })
          break
        
        case 'budgetAlert':
          // This will be triggered dynamically when user reaches 80% of daily budget
          break
        
        case 'paydayReminder':
          // This will be calculated based on user's payday setting
          break
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error)
    }
  }

  const cancelNotification = async (id: string) => {
    try {
      // Cancel specific notification identifiers
      await Notifications.cancelScheduledNotificationAsync(id)
    } catch (error) {
      console.error('Failed to cancel notification:', error)
    }
  }

  const handleStartTracking = async () => {
    setIsLoading(true)

    try {
      // Mark onboarding as complete
      completeOnboarding()

      // Save notification preferences to settings
      toggles.forEach(toggle => {
        setNotification(toggle.id as keyof typeof notifications, toggle.enabled)
      })

      // Navigate to main app (Dashboard)
      router.replace('/(tabs)')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      Alert.alert('Error', 'Failed to complete setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-8">
        {/* Progress Dots */}
        <View className="mb-12">
          <ProgressDots total={3} current={2} />
        </View>

        {/* Bell Icon */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-surface rounded-full items-center justify-center relative">
            <View className="absolute w-24 h-24 bg-purple/5 rounded-full" />
            <View className="w-16 h-16 bg-purple/10 rounded-full items-center justify-center">
              <Bell size={32} color="#6C63FF" />
            </View>
            
            <View className="absolute top-2 right-4 w-3 h-3 bg-teal rounded-full" />
          </View>
        </View>

        {/* Title */}
        <View className="items-center mb-8">
          <Text className="text-text-primary text-2xl font-bold text-center mb-2">
            Stay on top of your budget
          </Text>
          
          <Text className="text-text-secondary text-center">
            Choose which reminders work for you
          </Text>
        </View>

        {/* Notification Toggles */}
        <View className="bg-surface rounded-20 mb-6">
          {toggles.map((toggle, index) => (
            <View
              key={toggle.id}
              className={`flex-row items-center px-4 py-4 ${
                index !== toggles.length - 1 ? 'border-b border-divider' : ''
              }`}
            >
              <View className="w-10 h-10 bg-surface-input rounded-full items-center justify-center mr-4">
                {toggle.icon}
              </View>

              <View className="flex-1">
                <Text className="text-text-primary font-medium">{toggle.title}</Text>
                <Text className="text-text-muted text-sm">{toggle.subtitle}</Text>
              </View>

              <Switch
                value={toggle.enabled}
                onValueChange={(value) => handleToggle(toggle.id, value)}
                trackColor={{ false: '#2E2D45', true: '#00C9A7' }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* Helper Text */}
        <Text className="section-label text-center mb-8">
          YOU CAN CHANGE THESE ANYTIME IN SETTINGS
        </Text>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Start Tracking Button */}
        <Button
          onPress={handleStartTracking}
          disabled={isLoading}
          className="mb-4"
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-semibold text-lg">
              {isLoading ? 'Starting...' : 'Start Tracking'}
            </Text>
            {!isLoading && <PartyPopper size={20} color="#FFFFFF" />}
          </View>
        </Button>
      </View>
    </SafeAreaView>
  )
}
