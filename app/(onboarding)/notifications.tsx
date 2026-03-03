import { View, Text, Switch, Pressable, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import * as Notifications from 'expo-notifications'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {Array.from({ length: total }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => {
            if (index === 0) router.push('/(onboarding)')
            if (index === 1) router.push('/(onboarding)/income')
            if (index === 2) router.push('/(onboarding)/notifications')
          }}
          style={{
            width: index === current ? 32 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: index === current ? '#6C63FF' : '#2E2D45',
          }}
        />
      ))}
    </View>
  )
}

// Large filled bell icon for the hero section
function BellIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        fill="#6C63FF"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#6C63FF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

// Small filled bell icon for the notification toggle
function SmallBellIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        fill="#6C63FF"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#6C63FF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

function ChartIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3v18h18"
        stroke="#00C9A7"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 17V9"
        stroke="#00C9A7"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13 17V5"
        stroke="#00C9A7"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 17v-3"
        stroke="#00C9A7"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function CalendarIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="#8888AA"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

interface NotificationToggle {
  id: string
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  enabled: boolean
}

export default function OnboardingNotificationsScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  
  const { completeOnboarding } = useUserStore()
  const { notifications, setNotification } = useSettingsStore()

  const [toggles, setToggles] = useState<NotificationToggle[]>([
    {
      id: 'dailyReminder',
      icon: <SmallBellIcon />,
      iconBg: '#6C63FF20',
      title: 'Daily Entry Reminder',
      subtitle: 'Remind me to log expenses',
      enabled: true,
    },
    {
      id: 'budgetAlert',
      icon: <ChartIcon />,
      iconBg: '#00C9A720',
      title: 'Budget Alert',
      subtitle: 'Notify me when nearing my daily limit',
      enabled: true,
    },
    {
      id: 'paydayReminder',
      icon: <CalendarIcon />,
      iconBg: '#2E2D45',
      title: 'Payday Reminder',
      subtitle: 'Alert me 2 days before payday',
      enabled: false,
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
    if (value && !hasPermission) {
      const granted = await requestPermission()
      if (!granted) return
    }

    setToggles(prev =>
      prev.map(toggle =>
        toggle.id === id ? { ...toggle, enabled: value } : toggle
      )
    )

    setNotification(id as keyof typeof notifications, value)

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
              type: 'daily' as any,
              hour: 21,
              minute: 0,
            },
          })
          break
      }
    } catch (error) {
      
    }
  }

  const cancelNotification = async (id: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id)
    } catch (error) {
      
    }
  }

  const handleStartTracking = async () => {
    setIsLoading(true)
    try {
      completeOnboarding()
      toggles.forEach(toggle => {
        setNotification(toggle.id as keyof typeof notifications, toggle.enabled)
      })
      router.replace('/(tabs)')
    } catch (error) {
      
      Alert.alert('Error', 'Failed to complete setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0E1A' }}>
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          
          {/* Progress Dots */}
          <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 24 }}>
            <ProgressDots total={3} current={2} />
          </View>

          {/* Bell Icon with Glow */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{
              width: 200,
              height: 200,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: '#6C63FF',
                opacity: 0.07,
              }} />
              <View style={{
                width: 96,
                height: 96,
                backgroundColor: '#1A1928',
                borderRadius: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <BellIcon />
              </View>
            </View>
          </View>

          {/* Title */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{
              fontSize: 32,
              fontWeight: '800',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 38,
              marginBottom: 12,
            }}>
              Stay on top of{'\n'}your budget
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#8888AA',
              textAlign: 'center',
            }}>
              Choose which reminders work for you
            </Text>
          </View>

          {/* Notification Toggles Card */}
          <View style={{
            backgroundColor: '#1A1928',
            borderRadius: 16,
            marginBottom: 24,
          }}>
            {toggles.map((toggle, index) => (
              <View
                key={toggle.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderBottomWidth: index !== toggles.length - 1 ? 1 : 0,
                  borderBottomColor: '#2E2D45',
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  backgroundColor: toggle.iconBg,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  {toggle.icon}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#EEEEFF',
                    fontWeight: '600',
                    fontSize: 16,
                    marginBottom: 4,
                  }}>
                    {toggle.title}
                  </Text>
                  <Text style={{
                    color: '#8888AA',
                    fontSize: 13,
                  }}>
                    {toggle.subtitle}
                  </Text>
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
          <Text style={{
            color: '#4A4A6A',
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 1.5,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            YOU CAN CHANGE THESE ANYTIME IN SETTINGS
          </Text>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Start Tracking Button */}
          <Pressable
            onPress={handleStartTracking}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#6C63FF50' : '#6C63FF',
              borderRadius: 28,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6C63FF',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
              marginBottom: 40,
            }}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '600',
            }}>
              {isLoading ? 'Starting...' : 'Start Tracking 🎉'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}
