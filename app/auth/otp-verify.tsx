import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BackIcon } from "@/assets/svgs/BackIcon"
import { GroceryLogo } from "@/assets/svgs/GroceryLogo"
import { ShieldIcon } from "@/assets/svgs/ShieldIcon"
import { router, Stack, useLocalSearchParams } from "expo-router"





export default function OtpVerifyScreen() {
  const { phone: phoneNumber } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(TextInput | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join("")

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code")
      return
    }

    setIsLoading(true)
    try {
      // await onVerify?.(otpString)
    } catch (err) {
      setError("Invalid verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setIsResending(true)
    try {
      // await onResendOtp?.()
      setResendTimer(30)
      setCanResend(false)
      setOtp(["", "", "", "", "", ""])
      setError("")
    } catch (err) {
      setError("Failed to resend code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-4 pb-8">
            {/* Header with Back Button */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                <BackIcon />
              </TouchableOpacity>
            </View>

            {/* Logo and Title */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-lg">
                <GroceryLogo />
              </View>
              <Text className="text-black text-2xl font-bold">Verify Your Phone</Text>
              <Text className="text-black text-sm mt-2 text-center">Enter the 6-digit code sent to</Text>
              <Text className="text-black text-base font-semibold mt-1">{phoneNumber}</Text>
            </View>

            {/* Shield Icon Illustration */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center">
                <View className="w-18 h-18 bg-green-500/30 rounded-full items-center justify-center">
                  <ShieldIcon />
                </View>
              </View>
            </View>

            {/* OTP Input Fields */}
            <View className="flex-row justify-between mb-4 px-2">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className={`w-12 h-14 bg-white rounded-xl text-center text-black text-xl font-bold border border-gray-300 ${error ? "border-2 border-red-400" : ""
                    }`}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Error Message */}
            {error && <Text className="text-red-400 text-sm text-center mb-4">{error}</Text>}

            {/* Resend Code */}
            <View className="flex-row items-center justify-center mb-8">
              <Text className="text-emerald-400 text-sm">Didn't receive the code? </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} disabled={isResending}>
                  {isResending ? (
                    <ActivityIndicator size="small" color="#4ade80" />
                  ) : (
                    <Text className="text-green-400 text-sm font-bold">Resend</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text className="text-emerald-500 text-sm">
                  Resend in <Text className="text-green-400 font-semibold">{resendTimer}s</Text>
                </Text>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerify}
              disabled={isLoading}
              className="bg-green-500 py-4 rounded-2xl items-center active:opacity-80 shadow-lg"
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Verify & Continue</Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <Text className="text-emerald-500 text-xs text-center mt-6">
              Having trouble? Contact support at help@SrMart.com
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
