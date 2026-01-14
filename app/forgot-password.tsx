import { BackIcon } from "@/assets/svgs/BackIcon"
import { EmailIcon } from "@/assets/svgs/EmailIcon"
import { GroceryLogo } from "@/assets/svgs/GroceryLogo"
import { LockResetIcon } from "@/assets/svgs/LockResetIcon"
import { SuccessIcon } from "@/assets/svgs/SuccessIcon"
import { router, Stack } from "expo-router"
import { useState } from "react"
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


export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = () => {
    if (!email) {
      setError("Email is required")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      return false
    }
    return true
  }

  const handleResetPassword = async () => {
    if (!validateEmail()) return

    setIsLoading(true)
    setError("")

    try {
      // await onResetPassword?.(email)
      setIsSuccess(true)
    } catch (err) {
      setError("Failed to send reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Success State
  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 px-6 pt-4 pb-8 justify-center">
          {/* Success Illustration */}
          <View className="items-center mb-8">
            <View className="w-28 h-28 bg-green-500/20 rounded-full items-center justify-center">
              <View className="w-20 h-20 bg-green-500/30 rounded-full items-center justify-center">
                <SuccessIcon />
              </View>
            </View>
          </View>

          {/* Success Message */}
          <View className="items-center mb-8">
            <Text className="text-black text-2xl font-bold mb-3">Check Your Email</Text>
            <Text className="text-gray-400 text-sm text-center leading-5 px-4">
              We've sent a password reset link to
            </Text>
            <Text className="text-gray-400 text-base font-semibold mt-2">{email}@gmail</Text>
            <Text className="text-gray-400 text-sm text-center mt-4 px-4 leading-5">
              Click the link in the email to reset your password. The link will expire in 24 hours.
            </Text>
          </View>

          {/* Back to Login Button */}
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            className="bg-green-500 py-4 rounded-2xl items-center active:opacity-80 shadow-lg"
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">Back to Login</Text>
          </TouchableOpacity>

          {/* Didn't receive email */}
          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-emerald-400 text-sm">Didn't receive email? </Text>
            <TouchableOpacity
              onPress={() => {
                setIsSuccess(false)
                setEmail("")
              }}
            >
              <Text className="text-green-400 text-sm font-bold">Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{headerShown:false}}/>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-4 pb-8 justify-center ">
            {/* Header with Back Button */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                <BackIcon />
              </TouchableOpacity>
            </View>

            {/* Logo and Title */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-lg">
                <GroceryLogo />
              </View>
              <Text className="text-black text-2xl font-bold">Forgot Password?</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center px-6 leading-5">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </Text>
            </View>

            {/* Lock Reset Illustration */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center">
                <View className="w-18 h-18 bg-green-500/30 rounded-full items-center justify-center">
                  <LockResetIcon />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-6">
              <Text className="text-emerald-400 text-sm font-medium mb-2 ml-1">Email Address</Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border border-gray-300 ${error ? "border-red-400" : ""
                  }`}
              >
                <EmailIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Enter your email"
                  placeholderTextColor="#000"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text)
                    if (error) setError("")
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
            </View>

            {/* Send Reset Link Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              className="bg-green-500 py-4 rounded-2xl items-center active:opacity-80 shadow-lg"
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-emerald-400 text-sm">Remember your password? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="text-green-400 text-sm font-bold">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
