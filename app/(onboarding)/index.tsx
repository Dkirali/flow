import { View, Text, Pressable, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useUserStore } from '@/stores/userStore'
import { db } from '@/db/client'
import { settings } from '@/db/schema'

function NeuralNetwork() {
  return (
    <Svg width={220} height={220} viewBox="0 0 200 200">
      <Path
        d="M40,100 L70,60 M70,60 L130,50 M130,50 L160,90 M160,90 L140,140 M140,140 L80,150 M80,150 L40,100"
        stroke="#6C63FF"
        strokeWidth={0.8}
        fill="none"
        opacity={0.4}
      />
      <Path
        d="M70,60 L100,100 M100,100 L130,50 M100,100 L140,140 M100,100 L80,150"
        stroke="#00C9A7"
        strokeWidth={0.8}
        fill="none"
        opacity={0.3}
      />
      
      <Circle cx={40} cy={100} r={4.5} fill="#6C63FF" />
      <Circle cx={130} cy={50} r={5.5} fill="#6C63FF" />
      <Circle cx={80} cy={150} r={3.5} fill="#6C63FF" />
      <Circle cx={160} cy={90} r={4.5} fill="#6C63FF" />
      
      <Circle cx={70} cy={60} r={4.5} fill="#00C9A7" />
      <Circle cx={100} cy={100} r={6.5} fill="#00C9A7" />
      <Circle cx={140} cy={140} r={3.5} fill="#00C9A7" />
      
      <Circle cx={50} cy={140} r={1.5} fill="#6C63FF" opacity={0.6} />
      <Circle cx={150} cy={60} r={1.5} fill="#00C9A7" opacity={0.6} />
    </Svg>
  )
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {Array.from({ length: total }).map((_, index) => (
        <Pressable
          key={index}
          onPress={() => {
            if (index === 0) 
              router.push('/(onboarding)/')
            if (index === 1) 
              router.push('/(onboarding)/income')
            if (index === 2) 
              router.push('/(onboarding)/notifications')
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

export default function OnboardingNameScreen() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const { setName: setStoreName } = useUserStore()

  const handleContinue = async () => {
    if (name.trim().length < 2) return

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
      // Error handled silently
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0E1A' }}>
        {/* Progress dots — top */}
        <View style={{ alignItems: 'center', paddingTop: 16 }}>
          <ProgressDots total={3} current={0} />
        </View>

        {/* Neural network — upper section */}
        <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16 }}>
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 240,
            height: 240,
          }}>
            {/* Radial glow — no solid background */}
            <View style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: '#3D35CC',
              opacity: 0.05,
            }} />
            <NeuralNetwork />
          </View>
        </View>

        {/* Text — directly below graphic */}
        <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingBottom: 32 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: '800',
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 38,
            marginBottom: 12,
            fontFamily: 'Inter-ExtraBold',
          }}>
            Meet Your AI{'\n'}Money Brain
          </Text>
          <Text style={{
            fontSize: 15,
            color: '#8888AA',
            textAlign: 'center',
            lineHeight: 22,
            maxWidth: 280,
          }}>
            FLŌW learns your habits and helps you spend smarter every day
          </Text>
        </View>

        {/* Spacer pushes input to bottom */}
        <View style={{ flex: 0.4 }} />

        {/* Input + button — bottom section */}
        <View style={{ 
          paddingHorizontal: 24,
          paddingBottom: 40,
          flexDirection: 'column',
          rowGap: 12,
        }}>
          <Text style={{
            color: '#8888AA',
            fontSize: 13,
            fontWeight: '600',
            paddingLeft: 4,
          }}>
            What should we call you?
          </Text>
          
          <TextInput
            style={[
              {
                backgroundColor: '#1E1D30',
                color: '#FFFFFF',
                fontSize: 16,
                fontFamily: 'Inter-Medium',
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 20,
              },
              isFocused && { borderWidth: 2, borderColor: '#6C63FF' }
            ]}
            placeholder="Enter your name"
            placeholderTextColor="#4A4A6A"
            value={name}
            onChangeText={setName}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <Pressable
            onPress={handleContinue}
            disabled={name.length < 2 || isLoading}
            style={{
              backgroundColor: name.length >= 2 && !isLoading ? '#6C63FF' : '#6C63FF50',
              borderRadius: 28,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6C63FF',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
              marginTop: 4,
            }}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '600',
              fontFamily: 'Inter-SemiBold',
            }}>
              Continue →
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  )
}
