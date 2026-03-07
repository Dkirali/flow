import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'
import { Home, BarChart3, Calendar, Settings } from 'lucide-react-native'
import { useSettingsStore } from '@/stores/settingsStore'

export default function TabsLayout() {
  const { theme, accentColor } = useSettingsStore()
  const systemScheme = useColorScheme()
  
  // Determine effective theme
  const effectiveTheme = theme === 'system' ? systemScheme : theme
  const isDark = effectiveTheme === 'dark'
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1928' : '#FFFFFF',
          borderTopColor: isDark ? '#2E2D45' : '#E0E0E0',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: isDark ? '#4A4A6A' : '#999999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      {/* Hidden from tab bar — accessible via router.push */}
      <Tabs.Screen
        name="transactions"
        options={{ href: null }}
      />
    </Tabs>
  )
}
