# FLŌW - Budget Tracking Application
## Complete Technical Specification

---

## 📱 Project Overview

**App Name:** FLŌW  
**Type:** React Native Mobile Application  
**Platform:** iOS & Android (Expo Go compatible)  
**Total Code:** 3,471 lines of TypeScript/TSX  
**Dependencies:** 41 production packages  
**Architecture:** Expo SDK 54 with New Architecture (Fabric) enabled

**Core Purpose:** AI-powered budget tracking with calendar-based expense management, daily budget rings, and smart insights.

---

## 🏗️ Tech Stack

### **Core Framework**
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo SDK | 54.0.0 | Development platform & native modules |
| TypeScript | 5.9.2 | Type-safe development |
| React | 19.1.0 | UI library |

### **Navigation & Routing**
| Library | Version | Purpose |
|---------|---------|---------|
| expo-router | 6.0.23 | File-based routing system |
| react-native-screens | 4.16.0 | Native screen transitions |
| react-native-safe-area-context | 5.6.0 | Safe area handling |

### **State Management**
| Library | Version | Purpose |
|---------|---------|---------|
| zustand | 5.0.11 | Global state management |
| @react-native-async-storage/async-storage | 2.2.0 | Persistent storage |

### **Database & Backend**
| Library | Version | Purpose |
|---------|---------|---------|
| expo-sqlite | 16.0.10 | Local SQLite database |
| drizzle-orm | 0.45.1 | Type-safe ORM |
| drizzle-kit | 0.31.9 | Database migrations & tooling |

### **Styling & UI**
| Library | Version | Purpose |
|---------|---------|---------|
| nativewind | 4.2.2 | Tailwind CSS for React Native |
| tailwindcss | 3.4.17 | Utility-first CSS framework |
| react-native-svg | 15.12.1 | SVG graphics & icons |
| lucide-react-native | 0.575.0 | Icon library |

### **Animations & Interactions**
| Library | Version | Purpose |
|---------|---------|---------|
| react-native-reanimated | 4.1.1 | Smooth animations |
| react-native-worklets | 0.5.1 | Worklet runtime for animations |
| react-native-gesture-handler | 2.28.0 | Touch gestures & interactions |
| expo-haptics | 15.0.8 | Haptic feedback |

### **Charts & Visualization**
| Library | Version | Purpose |
|---------|---------|---------|
| react-native-gifted-charts | 1.4.74 | Gifted charts library (deprecated in favor of custom) |

### **AI & Intelligence**
| Library | Version | Purpose |
|---------|---------|---------|
| ai | 3.0.21 | Vercel AI SDK |
| @ai-sdk/openai | 3.0.36 | OpenAI integration |

### **Utilities**
| Library | Version | Purpose |
|---------|---------|---------|
| date-fns | 4.1.0 | Date manipulation |
| zod | 3.25.76 | Schema validation |
| expo-crypto | 15.0.8 | Cryptographic functions |

### **Notifications**
| Library | Version | Purpose |
|---------|---------|---------|
| expo-notifications | 0.32.16 | Push notifications |

### **Development Tools**
| Library | Version | Purpose |
|---------|---------|---------|
| @expo/ngrok | 4.1.3 | Tunnel for testing |

---

## 📁 Project Structure

```
flow-budget/
├── app/                           # Main application code (expo-router)
│   ├── (onboarding)/              # Onboarding flow group
│   │   ├── index.tsx              # Name entry screen (222 lines)
│   │   ├── income.tsx             # Income setup screen (660 lines)
│   │   ├── notifications.tsx      # Notification preferences (418 lines)
│   │   └── _layout.tsx            # Onboarding layout (16 lines)
│   ├── (tabs)/                    # Main tab navigation
│   │   ├── index.tsx              # Dashboard screen (382 lines)
│   │   ├── insights.tsx           # AI insights screen (9 lines)
│   │   ├── calendar.tsx           # Calendar view (9 lines)
│   │   ├── settings.tsx           # Settings screen (9 lines)
│   │   └── _layout.tsx            # Tab bar layout (48 lines)
│   ├── api/                       # API routes
│   │   └── chat+api.ts            # OpenAI chat endpoint (25 lines)
│   └── _layout.tsx                # Root layout with providers (110 lines)
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── HorizontalBarChart.tsx # Custom chart component (244 lines)
│   │   ├── DraggableFAB.tsx       # Draggable FAB (299 lines)
│   │   ├── CurrencySelector.tsx   # Currency picker (105 lines)
│   │   ├── BottomSheet.tsx        # Modal bottom sheet (100 lines)
│   │   ├── ProgressRing.tsx       # Animated budget ring (69 lines)
│   │   ├── Button.tsx             # Button component (46 lines)
│   │   ├── Input.tsx              # Text input (36 lines)
│   │   ├── Card.tsx               # Card container (17 lines)
│   │   ├── Chip.tsx               # Chip/tag component (31 lines)
│   │   ├── Badge.tsx              # Badge component (27 lines)
│   │   ├── Toggle.tsx             # Toggle switch (20 lines)
│   │   └── SectionLabel.tsx       # Section header (13 lines)
│   └── onboarding/
│       └── ProgressDots.tsx       # Progress indicator (23 lines)
├── stores/                        # Zustand state stores
│   ├── userStore.ts               # User profile state (25 lines)
│   ├── settingsStore.ts           # App settings (88 lines)
│   ├── transactionStore.ts        # Transactions state (131 lines)
│   └── budgetStore.ts             # Budget calculations (155 lines)
├── db/                            # Database layer
│   ├── client.ts                  # SQLite client setup
│   ├── schema.ts                  # Table definitions (46 lines)
│   └── queries/
│       └── transactions.ts        # Transaction queries (88 lines)
├── utils/                         # Utility functions
│   ├── dashboardLogic.ts          # Dashboard calculations (329 lines)
│   ├── budgetCalculator.ts        # Budget math
│   ├── dateHelpers.ts             # Date utilities
│   ├── generateId.ts              # UUID generation
│   └── recurringEngine.ts         # Recurring transactions
├── types/                         # TypeScript types
│   └── transaction.ts             # Transaction types
├── constants/                     # App constants
│   └── currencies.ts              # Currency definitions
├── hooks/                         # Custom React hooks
├── assets/                        # Images, icons, fonts
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── package.json                   # Dependencies
├── app.config.ts                  # Expo configuration
├── babel.config.js                # Babel configuration
├── metro.config.js                # Metro bundler config
├── tailwind.config.ts             # Tailwind configuration
└── drizzle.config.ts              # Drizzle ORM config
```

---

## 🎨 Screens & Features

### **Phase 1: Onboarding (COMPLETED)**

#### Screen 1: Name Entry
- **File:** `app/(onboarding)/index.tsx`
- **Features:**
  - Neural network SVG animation
  - Name input with validation
  - Progress dots navigation
  - Saves to `userStore`

#### Screen 2: Income Setup
- **File:** `app/(onboarding)/income.tsx`
- **Features:**
  - Monthly income input with currency selector
  - Payday frequency options (1st, 15th, Last Day, Custom)
  - Custom date picker modal
  - Recurring toggle
  - Saves to `settingsStore` and `budgetStore`
- **Stores Used:** `settingsStore.setIncome()`, `budgetStore.addIncomeSource()`

#### Screen 3: Notification Preferences
- **File:** `app/(onboarding)/notifications.tsx`
- **Features:**
  - Daily reminders toggle with time picker
  - Budget alert toggle with threshold slider
  - Payday reminder toggle
  - Monthly report toggle
  - Saves to `settingsStore`

---

### **Phase 2: Dashboard (COMPLETED)**

#### Main Dashboard Screen
- **File:** `app/(tabs)/index.tsx` (382 lines)
- **Features:**
  - **Header:** User greeting with avatar, notification bell
  - **Time Period Selector:** Day / Month / Year tabs
  - **Financial Overview Card:**
    - Horizontal bar chart comparing current vs previous period
    - 3 rows: Income, Expense, Savings
    - Side-by-side comparison (Current vs Previous)
    - Chart options menu (Export, Breakdown, Filter)
  - **Quick Stats Cards:**
    - Total Income with trend indicator
    - Total Expenses with trend indicator
  - **Daily Budget Ring:**
    - Animated SVG progress ring
    - Shows remaining budget
    - Spent today amount
    - Days remaining in period
  - **Recent Activity List:**
    - Last 5 transactions
    - Category icons
    - Formatted dates (Today, Yesterday, Weekday)
  - **Draggable FAB:**
    - Floating action button for adding transactions
    - Draggable to any position
    - Remembers position across sessions
    - Snaps to left/right edges

#### Dashboard Logic
- **File:** `utils/dashboardLogic.ts` (329 lines)
- **Aggregations:**
  - **Day View:** Today vs Yesterday comparison
  - **Month View:** This Week vs Last Week (Monday-Sunday calendar weeks)
  - **Year View:** This Month vs Last Month comparison
- **Calculations:**
  - Daily budget = Monthly Income / Days in month
  - Savings = Income - Expenses
  - Goal progress tracking
  - Budget ring calculations

---

### **Phase 3: Additional Screens (STRUCTURE ONLY)**

#### Insights Tab
- **File:** `app/(tabs)/insights.tsx`
- **Status:** Placeholder (9 lines)
- **Planned Features:**
  - AI-powered spending analysis
  - Category breakdowns
  - Trend predictions
  - Budget recommendations

#### Calendar Tab
- **File:** `app/(tabs)/calendar.tsx`
- **Status:** Placeholder (9 lines)
- **Planned Features:**
  - Monthly calendar view
  - Transaction dots on dates
  - Daily transaction list
  - Recurring transaction indicators

#### Settings Tab
- **File:** `app/(tabs)/settings.tsx`
- **Status:** Placeholder (9 lines)
- **Planned Features:**
  - Profile management
  - Currency settings
  - Notification preferences
  - Theme settings
  - Data export
  - AI settings

---

## 🗄️ Database Schema

### **Transactions Table**
```typescript
{
  id: string (UUID)
  amount: number
  type: 'income' | 'expense'
  category: string
  note: string (optional)
  date: string (ISO date)
  time: string (ISO time)
  isMandatory: boolean (default: false)
  isLeisure: boolean (default: false)
  isRecurring: boolean (default: false)
  recurringFrequency: string (optional)
  recurringDay: number (optional)
  currencyCode: string (default: 'USD')
  createdAt: string (ISO timestamp)
}
```

### **Income Sources Table**
```typescript
{
  id: string (UUID)
  name: string
  amount: number
  category: string
  isRecurring: boolean (default: true)
  recurringFrequency: string (optional)
  recurringDay: number (optional)
  currencyCode: string (default: 'USD')
  createdAt: string (ISO timestamp)
}
```

### **Mandatory Expenses Table**
```typescript
{
  id: string (UUID)
  name: string
  amount: number
  category: string
  isRecurring: boolean (default: true)
  recurringDay: number (optional)
  createdAt: string (ISO timestamp)
}
```

### **Settings Table**
```typescript
{
  id: string (primary: 'default')
  currency: string (default: 'USD')
  currencySymbol: string (default: '$')
  theme: 'light' | 'dark' | 'system' (default: 'dark')
  accentColor: string (default: '#6C63FF')
  aiEnabled: boolean (default: true)
  aiDataScope: '1M' | '3M' | '6M' | 'all' (default: '3M')
  investmentComparisons: boolean (default: true)
  notifications: {
    dailyReminder: boolean (default: true)
    dailyReminderTime: string (default: '21:00')
    budgetAlert: boolean (default: true)
    budgetAlertThreshold: number (default: 80)
    paydayReminder: boolean (default: true)
    monthlyReport: boolean (default: false)
    recurringAlert: boolean (default: false)
  }
  monthlyIncome: number (default: 0)
  paydayDay: number (default: 1)
  paydayFrequency: 'weekly' | 'bi-weekly' | 'monthly' (default: 'monthly')
}
```

---

## 🎨 Design System

### **Color Palette**
```css
/* Primary Colors */
--primary-purple: #6C63FF
--secondary-teal: #00C9A7
--expense-red: #FF6B6B

/* Background Colors */
--bg-dark: #0F0E1A
--surface-card: #1A1928
--surface-hover: #2E2D45

/* Text Colors */
--text-primary: #FFFFFF
--text-secondary: #8888AA
--text-muted: #4A4A6A

/* Semantic */
--success: #00C9A7
--warning: #FFB800
--error: #FF6B6B
```

### **Typography**
- **Font Family:** Inter (system fallback)
- **Weights:** 400 (Regular), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold)
- **Scale:**
  - Heading 1: 26px / 800 weight
  - Heading 2: 20px / 700 weight
  - Heading 3: 18px / 700 weight
  - Body: 15px / 400 weight
  - Caption: 11-13px / 600 weight
  - Label: 11px / 700 weight (uppercase, letter-spacing: 1.5)

### **Components**

#### Cards
- Background: #1A1928
- Border Radius: 16-20px
- Padding: 16-20px

#### Buttons
- Primary: #6C63FF background, white text, 28px border radius
- Shadow: #6C63FF with 35% opacity, 8px offset

#### Inputs
- Background: #1A1928
- Border: 0-2px #6C63FF (when focused)
- Border Radius: 16px
- Padding: 14px 16px

---

## 🔧 Configuration Files

### **app.config.ts**
```typescript
{
  name: 'FLŌW',
  slug: 'flow-budget',
  version: '1.0.0',
  sdkVersion: '54.0.0',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-font',
    ['expo-notifications', { icon: './assets/notification-icon.png', color: '#6C63FF' }]
  ],
  ios: { bundleIdentifier: 'com.yourcompany.flow' },
  android: { package: 'com.yourcompany.flow' }
}
```

### **metro.config.js**
- NativeWind integration
- SQL file support
- Expo defaults

### **babel.config.js**
- expo-preset-expo with nativewind jsxImportSource
- react-native-reanimated/plugin

### **tailwind.config.ts**
- Custom colors matching design system
- NativeWind v4 configuration

---

## 📊 Key Features Implemented

### **✅ Completed Features**
1. **Onboarding Flow** (3 screens)
   - Name entry with animated graphics
   - Income setup with currency picker and payday options
   - Notification preferences

2. **Dashboard**
   - User greeting and profile
   - Time period switching (Day/Month/Year)
   - Horizontal bar chart with period comparison
   - Quick stats cards (Income/Expenses)
   - Daily budget ring with progress
   - Recent transactions list
   - Draggable FAB

3. **State Management**
   - User profile persistence
   - Settings persistence (income, notifications, theme)
   - Transaction store (add/update/delete)
   - Budget calculations with real-time updates

4. **Database**
   - SQLite with Drizzle ORM
   - Transaction CRUD operations
   - Schema migrations

5. **UI Components**
   - Custom horizontal bar chart
   - Draggable FAB
   - Animated progress ring
   - Currency selector
   - Bottom sheet modal
   - Form components (Button, Input, Toggle, etc.)

### **🚧 Partially Implemented**
1. **AI Integration** - OpenAI SDK configured, API route created
2. **Notifications** - Expo notifications configured, permission handling ready
3. **Charts** - Basic structure, needs more data

### **📋 Planned Features**
1. **Calendar View** - Monthly calendar with transaction markers
2. **Insights Tab** - AI-powered analysis and recommendations
3. **Settings Page** - Full settings management
4. **Recurring Transactions** - Automatic creation based on schedule
5. **Export Functionality** - CSV/PDF export
6. **Multi-currency Support** - Real-time exchange rates
7. **Budget Goals** - Track savings goals with progress
8. **Widget Support** - iOS/Android home screen widgets

---

## 🐛 Known Issues & Resolutions

### **Issue 1: Income Shows $0**
**Status:** ✅ **RESOLVED**
**Fix:** Added store rehydration check in dashboard
**Files:** `app/(tabs)/index.tsx`

### **Issue 2: Chart Overflow**
**Status:** ✅ **RESOLVED**
**Fix:** Replaced vertical BarChart with custom HorizontalBarChart
**Files:** `components/ui/HorizontalBarChart.tsx`

### **Issue 3: FAB Crash on Drag**
**Status:** ✅ **RESOLVED**
**Fix:** Added error boundaries and validation in DraggableFAB
**Files:** `components/ui/DraggableFAB.tsx`

---

## 🚀 Build Configuration

### **EAS Build (Production)**
```json
{
  "cli": {
    "version": ">= 5.9.0",
    "promptToConfigurePushNotifications": false
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "enterpriseProvisioning": "adhoc" }
    },
    "production": {
      "ios": { "enterpriseProvisioning": "adhoc" }
    }
  }
}
```

---

## 📈 Statistics

- **Total Lines of Code:** 3,471
- **TypeScript/TSX Files:** 35
- **Components:** 18
- **Screens:** 7
- **Stores:** 4
- **Database Tables:** 4
- **Dependencies:** 41 production + 4 dev
- **Time Invested:** ~40 hours of development

---

## 🎯 Next Steps

1. **Complete Insights Tab** - Implement AI spending analysis
2. **Complete Calendar Tab** - Build monthly calendar view
3. **Complete Settings Tab** - Full settings management
4. **Add Real Transactions** - Connect to actual database data
5. **Implement Recurring Engine** - Auto-create recurring transactions
6. **Add Export Feature** - CSV/PDF export functionality
7. **Testing** - Unit tests, E2E tests
8. **App Store Submission** - Prepare for iOS App Store and Google Play

---

**Built with ❤️ using Expo SDK 54, React Native, and TypeScript**
