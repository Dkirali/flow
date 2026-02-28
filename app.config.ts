import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FLŌW',
  slug: 'flow-budget',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0914',
  },
  ios: {
    bundleIdentifier: 'com.yourcompany.flow',
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: {
      NSUserNotificationUsageDescription:
        'FLŌW sends reminders to log expenses and alerts when nearing your daily budget.',
    },
  },
  android: {
    package: 'com.yourcompany.flow',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0914',
    },
    permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-font',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#6C63FF',
      },
    ],
  ],
  // extra: {
  //   eas: {
  //     projectId: 'PLACEHOLDER',
  //   },
  // },
  experiments: {
    typedRoutes: true,
  },
  newArchEnabled: true,
})
