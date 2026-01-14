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

import { LeafDecor } from "@/assets/svgs/LeafDecor"
import { GroceryLogo } from "@/assets/svgs/GroceryLogo"
import { GoogleLogo } from "@/assets/svgs/GoogleLogo"
import { EmailIcon } from "@/assets/svgs/EmailIcon"
import { LockIcon } from "@/assets/svgs/LockIcon"
import { EyeIcon } from "@/assets/svgs/EyeIcon"
import { router, Stack } from "expo-router"


interface LoginScreenProps {
  onGoogleSignIn?: () => Promise<void>
  onEmailSignIn?: (email: string, password: string) => Promise<void>
  onForgotPassword?: () => void
  onSignUp?: () => void
}

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailSignIn = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // await onEmailSignIn?.(email, password)
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      // await onGoogleSignIn?.()
    } catch (error) {
      console.error("Google sign in error:", error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-12 pb-8 justify-between">
            {/* Header Section */}
            <View className="items-center pt-8">
              <View className="absolute top-0 right-0 opacity-30">
                <LeafDecor />
              </View>
              <View className="absolute top-4 left-4 opacity-20 rotate-45">
                <LeafDecor />
              </View>

              <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-lg">
                <GroceryLogo />
              </View>
              <Text className="text-black text-3xl font-bold tracking-tight">SrMart</Text>
              <Text className="text-gray-500 text-base mt-2 text-center">Fresh groceries, delivered to your door</Text>
            </View>


            {/* Form Section */}
            <View className="flex-1 justify-center py-8">
              {/* Google Sign In Button */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex-row items-center justify-center bg-white py-4 rounded-2xl mb-6 active:opacity-80 shadow-sm border border-gray-300"
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <GoogleLogo />
                    <Text className="text-gray-800 text-base font-semibold ml-3">Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="text-gray-500 text-sm mx-4">or sign in with email</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-gray-500 text-sm font-medium mb-2 ml-1">Email</Text>
                <View
                  className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.email ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <EmailIcon />
                  <TextInput
                    className="flex-1 py-4 px-3 text-black text-base focus:outline-none bg-white"
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text)
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && <Text className="text-red-400 text-xs mt-1 ml-1">{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View className="mb-4">
                <Text className="text-gray-500 text-sm font-medium mb-2 ml-1">Password</Text>
                <View
                  className={`flex-row items-center bg-white rounded-2xl px-4 border ${errors.password ? "border-red-400" : "border-gray-300"
                    }`}
                >
                  <LockIcon />
                  <TextInput
                    className="flex-1 py-4 px-3 text-black text-base focus:outline-none bg-white"
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                    <EyeIcon visible={showPassword} />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text className="text-red-400 text-xs mt-1 ml-1">{errors.password}</Text>}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={() => {}} className="self-end mb-6">
                <Text className="text-gray-500 text-sm font-medium">Forgot password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleEmailSignIn}
                disabled={isLoading}
                className="bg-[#5ac268] py-4 rounded-2xl items-center active:opacity-80 shadow-lg border border-gray-300"
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-white text-base font-bold">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Section */}
            <View className="flex-row items-center justify-center pb-4">
              <Text className="text-gray-500 text-sm">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/sign-up')}>
                <Text className="text-[#5ac268] text-sm font-bold">Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
