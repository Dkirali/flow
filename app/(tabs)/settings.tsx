import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
  TextInput,
  FlatList,
  useColorScheme,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useCallback, useEffect, useContext, createContext } from 'react'
import { Bell, Download, Trash2, X, Check } from 'lucide-react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated'
import { useUserStore } from '@/stores/userStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useBudgetStore } from '@/stores/budgetStore'
import { useTransactionStore } from '@/stores/transactionStore'
import { currencies } from '@/constants/currencies'
import { KeyboardAvoidingView, Platform } from 'react-native'

const ACCENT_COLORS = ['#6C63FF', '#00C9A7', '#FF6B6B', '#FFD93D', '#4CC9F0'] as const
const SCOPE_MIN = 1
const SCOPE_MAX = 24

// ─── Theme System ─────────────────────────────────────────────

type BaseColors = {
  bg: string
  card: string
  text: string
  subtext: string
  divider: string
  track: string
  inputBg: string
  faint: string
}
type ThemeColors = BaseColors & { accent: string }

const DARK: BaseColors = {
  bg: '#0F0E1A',
  card: '#1A1928',
  text: '#FFFFFF',
  subtext: '#4A4A6A',
  divider: '#2E2D45',
  track: '#3A3850',
  inputBg: '#0F0E1A',
  faint: '#3A3850',
}

const LIGHT: BaseColors = {
  bg: '#F0EFF8',
  card: '#FFFFFF',
  text: '#1A1928',
  subtext: '#7B7A9D',
  divider: '#E8E7F0',
  track: '#D4D3EB',
  inputBg: '#F0EFF8',
  faint: '#D4D3EB',
}

const ThemeCtx = createContext<ThemeColors>({ ...DARK, accent: '#6C63FF' })
const useColors = () => useContext(ThemeCtx)

// ─── Section Header ───────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const c = useColors()
  return (
    <Text
      style={{
        color: c.subtext,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.2,
        marginTop: 28,
        marginBottom: 10,
      }}
    >
      {title}
    </Text>
  )
}

// ─── Settings Card ────────────────────────────────────────────

function SettingsCard({ children }: { children: React.ReactNode }) {
  const c = useColors()
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, overflow: 'hidden' }}>
      {children}
    </View>
  )
}

// ─── Settings Row ─────────────────────────────────────────────
// Uses Pressable for press feedback + inner View for layout — avoids
// flex direction bugs when applying style via callback on Pressable.

function SettingsRow({
  label,
  value,
  onPress,
  isLast = false,
}: {
  label: string
  value?: string
  onPress?: () => void
  isLast?: boolean
}) {
  const c = useColors()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed && onPress ? 'rgba(128,128,128,0.08)' : 'transparent',
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: c.divider,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <Text style={{ flex: 1, color: c.text, fontSize: 16 }}>{label}</Text>
        {value != null && (
          <Text style={{ color: c.subtext, fontSize: 16, marginRight: onPress ? 6 : 0 }}>
            {value}
          </Text>
        )}
        {onPress && (
          <Text style={{ color: c.subtext, fontSize: 20, lineHeight: 22 }}>›</Text>
        )}
      </View>
    </Pressable>
  )
}

// ─── Settings Toggle ─────────────────────────────────────────

function SettingsToggle({
  label,
  subtitle,
  value,
  onChange,
  isLast = false,
}: {
  label: string
  subtitle?: string
  value: boolean
  onChange: (v: boolean) => void
  isLast?: boolean
}) {
  const c = useColors()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: subtitle ? 12 : 14,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: c.divider,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: c.text, fontSize: 16 }}>{label}</Text>
        {subtitle && (
          <Text style={{ color: c.subtext, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor="#FFFFFF"
        trackColor={{ false: c.track, true: c.accent }}
        ios_backgroundColor={c.track}
      />
    </View>
  )
}

// ─── Theme Picker ─────────────────────────────────────────────

function ThemePicker({
  selected,
  onChange,
}: {
  selected: 'light' | 'dark' | 'system'
  onChange: (t: 'light' | 'dark' | 'system') => void
}) {
  const c = useColors()
  const options: {
    id: 'light' | 'dark' | 'system'
    label: string
    previewBg: string
    previewCard: string
  }[] = [
    { id: 'light', label: 'LIGHT', previewBg: LIGHT.bg, previewCard: LIGHT.card },
    { id: 'dark', label: 'DARK', previewBg: DARK.bg, previewCard: DARK.card },
    { id: 'system', label: 'SYSTEM', previewBg: '#2A2940', previewCard: '#1A1928' },
  ]

  return (
    <SettingsCard>
      <View style={{ flexDirection: 'row', padding: 12, gap: 10 }}>
        {options.map((opt) => {
          const isSelected = selected === opt.id
          return (
            <Pressable key={opt.id} onPress={() => onChange(opt.id)} style={{ flex: 1 }}>
              <View
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  borderWidth: isSelected ? 2 : 1.5,
                  borderColor: isSelected ? c.accent : c.track,
                }}
              >
                {/* Theme preview */}
                <View
                  style={{
                    height: 68,
                    backgroundColor: opt.previewBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: '65%',
                      height: 10,
                      backgroundColor: opt.previewCard,
                      borderRadius: 4,
                      opacity: 0.9,
                    }}
                  />
                  <View
                    style={{
                      width: '45%',
                      height: 6,
                      backgroundColor: opt.previewCard,
                      borderRadius: 3,
                      opacity: 0.5,
                    }}
                  />
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: c.accent,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {/* Label */}
                <View
                  style={{
                    backgroundColor: c.card,
                    paddingVertical: 6,
                    alignItems: 'center',
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: c.divider,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? c.accent : c.subtext,
                      fontSize: 11,
                      fontWeight: '600',
                      letterSpacing: 0.5,
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
              </View>
            </Pressable>
          )
        })}
      </View>
    </SettingsCard>
  )
}

// ─── Accent Color Row ─────────────────────────────────────────

function AccentColorRow({
  selected,
  onChange,
}: {
  selected: string
  onChange: (c: string) => void
}) {
  const c = useColors()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ flex: 1, color: c.text, fontSize: 16 }}>Accent Color</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {ACCENT_COLORS.map((color) => {
          const isSelected = selected === color
          return (
            <Pressable key={color} onPress={() => onChange(color)}>
              {/* Outer ring matches swatch color when selected */}
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isSelected ? color : 'transparent',
                  padding: 3,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: color,
                  }}
                />
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

// ─── Data Scope Slider ────────────────────────────────────────

function DataScopeSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const c = useColors()
  const trackWidthSV = useSharedValue(1)
  const thumbPercent = useSharedValue((value - SCOPE_MIN) / (SCOPE_MAX - SCOPE_MIN))
  const startPercent = useSharedValue(0)

  const updateMonths = useCallback(
    (pct: number) => {
      onChange(Math.round(pct * (SCOPE_MAX - SCOPE_MIN) + SCOPE_MIN))
    },
    [onChange]
  )

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startPercent.value = thumbPercent.value
    })
    .onUpdate((e) => {
      const newPct = Math.max(
        0,
        Math.min(1, startPercent.value + e.translationX / trackWidthSV.value)
      )
      thumbPercent.value = newPct
      runOnJS(updateMonths)(newPct)
    })

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPercent.value * (trackWidthSV.value - 20) }],
  }))

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbPercent.value * trackWidthSV.value,
  }))

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: c.text, fontSize: 16 }}>Data Scope</Text>
        <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>
          {value} Months
        </Text>
      </View>
      <View
        onLayout={(e) => {
          trackWidthSV.value = e.nativeEvent.layout.width
        }}
        style={{ height: 4, backgroundColor: c.track, borderRadius: 2 }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              height: 4,
              backgroundColor: c.accent,
              borderRadius: 2,
            },
            fillStyle,
          ]}
        />
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -8,
                left: 0,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: c.accent,
                borderWidth: 3,
                borderColor: c.card,
              },
              thumbStyle,
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  )
}

// ─── Payday Modal ─────────────────────────────────────────────

function PaydayModal({
  visible,
  currentFrequency,
  currentDay,
  onClose,
  onSave,
}: {
  visible: boolean
  currentFrequency: 'weekly' | 'bi-weekly' | 'monthly'
  currentDay: number
  onClose: () => void
  onSave: (frequency: 'weekly' | 'bi-weekly' | 'monthly', day: number) => void
}) {
  const c = useColors()
  const [freq, setFreq] = useState(currentFrequency)
  const [day, setDay] = useState(String(currentDay))

  useEffect(() => {
    if (visible) {
      setFreq(currentFrequency)
      setDay(String(currentDay))
    }
  }, [visible])

  const freqOptions: { id: 'weekly' | 'bi-weekly' | 'monthly'; label: string }[] = [
    { id: 'weekly',    label: 'Weekly' },
    { id: 'bi-weekly', label: 'Bi-weekly' },
    { id: 'monthly',   label: 'Monthly' },
  ]

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: c.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ flex: 1, color: c.text, fontSize: 20, fontWeight: '700' }}>Payday</Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <X size={22} color={c.subtext} />
                </Pressable>
              </View>

              <Text style={{ color: c.subtext, fontSize: 13, marginBottom: 10 }}>Frequency</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {freqOptions.map(opt => (
                  <Pressable
                    key={opt.id}
                    onPress={() => setFreq(opt.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: freq === opt.id ? c.accent : c.track,
                    }}
                  >
                    <Text style={{
                      color: freq === opt.id ? '#FFFFFF' : c.subtext,
                      fontSize: 14,
                      fontWeight: '600',
                    }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {freq === 'monthly' && (
                <>
                  <Text style={{ color: c.subtext, fontSize: 13, marginBottom: 6 }}>Day of month</Text>
                  <TextInput
                    value={day}
                    onChangeText={setDay}
                    keyboardType="number-pad"
                    placeholder="1–28"
                    placeholderTextColor={c.subtext}
                    style={{
                      backgroundColor: c.track,
                      borderRadius: 12,
                      padding: 14,
                      color: c.text,
                      fontSize: 20,
                      fontWeight: '600',
                      textAlign: 'center',
                      marginBottom: 20,
                    }}
                  />
                </>
              )}

              {freq !== 'monthly' && <View style={{ height: 20 }} />}

              <Pressable
                onPress={() => {
                  const numDay = freq === 'monthly' ? parseInt(day, 10) : 1
                  if (freq === 'monthly' && (isNaN(numDay) || numDay < 1 || numDay > 28)) return
                  onSave(freq, numDay)
                }}
                style={{
                  backgroundColor: c.accent,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Edit Profile Modal ───────────────────────────────────────

function EditProfileModal({
  visible,
  name,
  email,
  onClose,
  onSave,
}: {
  visible: boolean
  name: string
  email: string
  onClose: () => void
  onSave: (name: string, email: string) => void
}) {
  const c = useColors()
  const [nameVal, setNameVal] = useState(name)
  const [emailVal, setEmailVal] = useState(email)

  useEffect(() => {
    if (visible) {
      setNameVal(name)
      setEmailVal(email)
    }
  }, [visible])

  const inputStyle = {
    backgroundColor: c.track,
    borderRadius: 12,
    padding: 14,
    color: c.text,
    fontSize: 16 as const,
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: c.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                maxHeight: '80%',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ flex: 1, color: c.text, fontSize: 20, fontWeight: '700' }}>
                  Edit Profile
                </Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <X size={22} color={c.subtext} />
                </Pressable>
              </View>

              <Text style={{ color: c.subtext, fontSize: 13, marginBottom: 6 }}>Name</Text>
              <TextInput
                value={nameVal}
                onChangeText={setNameVal}
                placeholder="Your name"
                placeholderTextColor={c.subtext}
                style={[inputStyle, { marginBottom: 16 }]}
              />

              <Text style={{ color: c.subtext, fontSize: 13, marginBottom: 6 }}>
                Email (optional)
              </Text>
              <TextInput
                value={emailVal}
                onChangeText={setEmailVal}
                placeholder="your@email.com"
                placeholderTextColor={c.subtext}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[inputStyle, { marginBottom: 24 }]}
              />

              <Pressable
                onPress={() => {
                  if (nameVal.trim()) onSave(nameVal.trim(), emailVal.trim())
                }}
                style={{
                  backgroundColor: c.accent,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Edit Income Modal ────────────────────────────────────────

function EditIncomeModal({
  visible,
  currentIncome,
  currencySymbol,
  onClose,
  onSave,
}: {
  visible: boolean
  currentIncome: number
  currencySymbol: string
  onClose: () => void
  onSave: (amount: number) => void
}) {
  const c = useColors()
  const [val, setVal] = useState(currentIncome > 0 ? String(currentIncome) : '')

  useEffect(() => {
    if (visible) setVal(currentIncome > 0 ? String(currentIncome) : '')
  }, [visible, currentIncome])

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable 
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: c.card,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                maxHeight: '80%',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ flex: 1, color: c.text, fontSize: 20, fontWeight: '700' }}>
                  Monthly Income
                </Text>
                <Pressable onPress={onClose} hitSlop={12}>
                  <X size={22} color={c.subtext} />
                </Pressable>
              </View>

              <Text style={{ color: c.subtext, fontSize: 13, marginBottom: 6 }}>
                Amount ({currencySymbol})
              </Text>
              <TextInput
                value={val}
                onChangeText={setVal}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={c.subtext}
                style={{
                  backgroundColor: c.track,
                  borderRadius: 12,
                  padding: 14,
                  color: c.text,
                  fontSize: 32,
                  fontWeight: '600',
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              />

              <Pressable
                onPress={() => {
                  const num = parseFloat(val.replace(',', '.'))
                  if (!isNaN(num) && num > 0) onSave(num)
                }}
                style={{
                  backgroundColor: '#00C9A7',
                  borderRadius: 14,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Currency Picker Modal ────────────────────────────────────

function CurrencyPickerModal({
  visible,
  selectedCode,
  onClose,
  onSelect,
}: {
  visible: boolean
  selectedCode: string
  onClose: () => void
  onSelect: (code: string) => void
}) {
  const c = useColors()
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: c.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 24,
              height: '75%',
            }}
          >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
          >
            <Text style={{ flex: 1, color: c.text, fontSize: 20, fontWeight: '700' }}>
              Select Currency
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color={c.subtext} />
            </Pressable>
          </View>

          <FlatList
            data={[...currencies]}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCode
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.code)
                    onClose()
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? 'rgba(128,128,128,0.08)' : 'transparent',
                  })}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                    }}
                  >
                    <Text style={{ fontSize: 22, marginRight: 14 }}>{item.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 16 }}>{item.name}</Text>
                      <Text style={{ color: c.subtext, fontSize: 13 }}>
                        {item.code} · {item.symbol}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={c.accent} />}
                  </View>
                </Pressable>
              )
            }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────

export default function SettingsScreen() {
  const { name, email, setName, setEmail } = useUserStore()
  const {
    currency,
    currencySymbol,
    theme,
    accentColor,
    aiEnabled,
    investmentComparisons,
    dataScopeMonths,
    notifications,
    monthlyIncome,
    paydayDay,
    paydayFrequency,
    setCurrency,
    setTheme,
    setAccentColor,
    setAiEnabled,
    setInvestmentComparisons,
    setNotification,
    setDataScopeMonths,
    setIncome,
  } = useSettingsStore()
  const { mandatoryExpenses } = useBudgetStore()
  const { clearAll } = useTransactionStore()
  const systemScheme = useColorScheme()

  const [editProfileVisible, setEditProfileVisible] = useState(false)
  const [editIncomeVisible, setEditIncomeVisible] = useState(false)
  const [editPaydayVisible, setEditPaydayVisible] = useState(false)
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false)

  // Resolve live theme colors — re-computed whenever theme or accentColor changes
  const effectiveTheme = theme === 'system' ? (systemScheme ?? 'dark') : theme
  const baseColors = effectiveTheme === 'light' ? LIGHT : DARK
  const themeColors: ThemeColors = { ...baseColors, accent: accentColor }

  const mandatoryTotal = mandatoryExpenses.reduce((sum, e) => sum + e.amount, 0)
  const initial = name ? name.charAt(0).toUpperCase() : '?'

  const handleClearTransactions = () => {
    Alert.alert(
      'Clear All Transactions',
      'This will permanently delete all your transactions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAll()
            } catch {
              Alert.alert('Error', 'Failed to clear transactions.')
            }
          },
        },
      ]
    )
  }

  return (
    // Provider wraps everything so all subcomponents + modals react to theme/accent changes
    <ThemeCtx.Provider value={themeColors}>
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ───────────────────────────── */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            <Text
              style={{ flex: 1, color: themeColors.text, fontSize: 32, fontWeight: '700' }}
            >
              Settings
            </Text>
            <Pressable style={{ padding: 8 }}>
              <Bell size={22} color={themeColors.text} />
            </Pressable>
          </View>

          {/* ─── Profile Card ─────────────────────── */}
          <View
            style={{
              backgroundColor: themeColors.card,
              borderRadius: 20,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: themeColors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>
                {initial}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: themeColors.text, fontSize: 17, fontWeight: '600' }}>
                {name || 'Your Name'}
              </Text>
              <Text
                style={{
                  color: email ? themeColors.subtext : themeColors.faint,
                  fontSize: 14,
                  marginTop: 2,
                }}
              >
                {email || 'No email added'}
              </Text>
            </View>
            <Pressable
              onPress={() => setEditProfileVisible(true)}
              style={{
                borderWidth: 1,
                borderColor: themeColors.divider,
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 7,
              }}
            >
              <Text style={{ color: themeColors.text, fontSize: 14 }}>Edit</Text>
            </Pressable>
          </View>

          {/* ─── PREFERENCES ──────────────────────── */}
          <SectionHeader title="PREFERENCES" />
          <SettingsCard>
            <SettingsRow
              label="Currency"
              value={currency}
              onPress={() => setCurrencyPickerVisible(true)}
            />
            <SettingsRow
              label="Language"
              value="English"
              onPress={() => Alert.alert('Language', 'More languages coming soon.')}
            />
            <SettingsRow
              label="Monthly Income"
              value={`${currencySymbol}${monthlyIncome.toLocaleString()}`}
              onPress={() => setEditIncomeVisible(true)}
            />
            <SettingsRow
              label="Payday"
              value={
                paydayFrequency === 'bi-weekly'
                  ? 'Bi-weekly'
                  : paydayFrequency === 'weekly'
                  ? 'Weekly'
                  : `${paydayDay}${paydayDay === 1 ? 'st' : paydayDay === 2 ? 'nd' : paydayDay === 3 ? 'rd' : 'th'} of month`
              }
              onPress={() => setEditPaydayVisible(true)}
            />
            <SettingsRow
              label="Mandatory Expenses"
              value={`${currencySymbol}${mandatoryTotal.toLocaleString()}`}
              onPress={() =>
                Alert.alert(
                  'Mandatory Expenses',
                  'Manage your mandatory expenses here (coming soon).'
                )
              }
              isLast
            />
          </SettingsCard>

          {/* ─── APPEARANCE ───────────────────────── */}
          <SectionHeader title="APPEARANCE" />
          <ThemePicker selected={theme} onChange={setTheme} />
          <View style={{ height: 10 }} />
          <SettingsCard>
            <AccentColorRow selected={accentColor} onChange={setAccentColor} />
          </SettingsCard>

          {/* ─── NOTIFICATIONS ────────────────────── */}
          <SectionHeader title="NOTIFICATIONS" />
          <SettingsCard>
            <SettingsToggle
              label="Daily Entry Reminder"
              value={notifications.dailyReminder}
              onChange={(v) => setNotification('dailyReminder', v)}
            />
            <SettingsToggle
              label="Budget Alert"
              value={notifications.budgetAlert}
              onChange={(v) => setNotification('budgetAlert', v)}
            />
            <SettingsToggle
              label="Payday Reminder"
              value={notifications.paydayReminder}
              onChange={(v) => setNotification('paydayReminder', v)}
            />
            <SettingsToggle
              label="Security Alerts"
              value={notifications.securityAlerts}
              onChange={(v) => setNotification('securityAlerts', v)}
              isLast
            />
          </SettingsCard>

          {/* ─── AI & INSIGHTS ────────────────────── */}
          <SectionHeader title="AI & INSIGHTS" />
          <SettingsCard>
            <SettingsToggle
              label="Smart Suggestions"
              subtitle="Enable predictive spending AI"
              value={aiEnabled}
              onChange={setAiEnabled}
            />
            <SettingsToggle
              label="Investment Comparisons"
              subtitle="Benchmark against global averages"
              value={investmentComparisons}
              onChange={setInvestmentComparisons}
            />
            <DataScopeSlider value={dataScopeMonths} onChange={setDataScopeMonths} />
          </SettingsCard>

          {/* ─── DATA & PRIVACY ───────────────────── */}
          <SectionHeader title="DATA & PRIVACY" />
          <SettingsCard>
            <Pressable
              onPress={() => Alert.alert('Export Data', 'Data export coming soon.')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(128,128,128,0.08)' : 'transparent',
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: themeColors.divider,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <Text style={{ flex: 1, color: themeColors.text, fontSize: 16 }}>
                  Export Data
                </Text>
                <Download size={18} color={themeColors.subtext} />
              </View>
            </Pressable>
            <Pressable
              onPress={handleClearTransactions}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,107,107,0.08)' : 'transparent',
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <Text style={{ flex: 1, color: '#FF6B6B', fontSize: 16 }}>
                  Clear All Transactions
                </Text>
                <Trash2 size={18} color="#FF6B6B" />
              </View>
            </Pressable>
          </SettingsCard>

          {/* ─── Footer ───────────────────────────── */}
          <Text
            style={{
              color: themeColors.faint,
              fontSize: 13,
              textAlign: 'center',
              marginTop: 40,
              letterSpacing: 1,
            }}
          >
            FLŌW v1.0
          </Text>
        </ScrollView>

        {/* ─── Modals (inside Provider so they inherit theme) ─── */}
        <PaydayModal
          visible={editPaydayVisible}
          currentFrequency={paydayFrequency}
          currentDay={paydayDay}
          onClose={() => setEditPaydayVisible(false)}
          onSave={(freq, day) => {
            setIncome(monthlyIncome, day, freq)
            setEditPaydayVisible(false)
          }}
        />
        <EditProfileModal
          visible={editProfileVisible}
          name={name}
          email={email ?? ''}
          onClose={() => setEditProfileVisible(false)}
          onSave={(n, e) => {
            setName(n)
            setEmail(e)
            setEditProfileVisible(false)
          }}
        />
        <EditIncomeModal
          visible={editIncomeVisible}
          currentIncome={monthlyIncome}
          currencySymbol={currencySymbol}
          onClose={() => setEditIncomeVisible(false)}
          onSave={(amount) => {
            setIncome(amount, paydayDay, paydayFrequency)
            setEditIncomeVisible(false)
          }}
        />
        <CurrencyPickerModal
          visible={currencyPickerVisible}
          selectedCode={currency}
          onClose={() => setCurrencyPickerVisible(false)}
          onSelect={setCurrency}
        />
      </SafeAreaView>
    </ThemeCtx.Provider>
  )
}
