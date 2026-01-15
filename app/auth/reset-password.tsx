import { BackIcon } from "@/assets/svgs/BackIcon"
import { EyeIcon } from "@/assets/svgs/EyeIcon"
import { EyeOffIcon } from "@/assets/svgs/EyeOffIcon"
import { GroceryLogo } from "@/assets/svgs/GroceryLogo"
import { LockIcon } from "@/assets/svgs/LockIcon"
import { ShieldLockIcon } from "@/assets/svgs/ShieldLockIcon"
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
import { Svg, Path } from "react-native-svg"




export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [isSuccess, setIsSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must include uppercase, lowercase, and number"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // await onResetPassword?.(password, confirmPassword)
      setIsSuccess(true)
    } catch (err) {
      setErrors({ password: "Failed to reset password. Please try again." })
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
            <View className="w-28 h-28 bg-green-100 rounded-full items-center justify-center">
              <View className="w-20 h-20 bg-green-200 rounded-full items-center justify-center">
                <SuccessIcon />
              </View>
            </View>
          </View>

          {/* Success Message */}
          <View className="items-center mb-8">
            <Text className="text-gray-900 text-2xl font-bold mb-3">Password Reset!</Text>
            <Text className="text-gray-600 text-sm text-center leading-5 px-4">
              Your password has been successfully reset. You can now log in with your new password.
            </Text>
          </View>

          {/* Back to Login Button */}
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            className="bg-green-500 py-4 rounded-xl items-center active:opacity-80 shadow-sm"
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-bold">Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
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
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-lg">
                <GroceryLogo />
              </View>
              <Text className="text-gray-900 text-2xl font-bold">Reset Password</Text>
              <Text className="text-gray-500 text-sm mt-2 text-center px-6 leading-5">
                Create a new secure password for your FreshCart account
              </Text>
            </View>

            {/* Shield Lock Illustration */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center">
                <View className="w-18 h-18 bg-green-200 rounded-full items-center justify-center">
                  <ShieldLockIcon />
                </View>
              </View>
            </View>

            {/* New Password Input */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2 ml-1">New Password</Text>
              <View
                className={`flex-row items-center bg-white rounded-xl px-4 border ${errors.password ? "border-red-400" : "border-gray-200"
                  }`}
              >
                <LockIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon visible={showPassword} />}
                </TouchableOpacity>
              </View>
              {errors.password && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.password}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-medium mb-2 ml-1">Confirm Password</Text>
              <View
                className={`flex-row items-center bg-white rounded-xl px-4 border ${errors.confirmPassword ? "border-red-400" : "border-gray-200"
                  }`}
              >
                <LockIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-black text-base bg-white"
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text)
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon visible={showConfirmPassword} />}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</Text>}
            </View>

            {/* Password Requirements */}
            <View className="mb-6 bg-green-50 p-4 rounded-xl border border-green-100">
              <Text className="text-gray-700 text-xs font-semibold mb-2">Password must contain:</Text>
              <View className="gap-1">
                <Text className={`text-xs ${password.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
                  {password.length >= 8 ? "✓" : "○"} At least 8 characters
                </Text>
                <Text className={`text-xs ${/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                  {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter
                </Text>
                <Text className={`text-xs ${/[a-z]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                  {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter
                </Text>
                <Text className={`text-xs ${/\d/.test(password) ? "text-green-600" : "text-gray-500"}`}>
                  {/\d/.test(password) ? "✓" : "○"} One number
                </Text>
              </View>
            </View>

            {/* Reset Password Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              className="bg-green-500 py-4 rounded-xl items-center active:opacity-80 shadow-sm"
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-gray-500 text-sm">Remember your password? </Text>
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="text-green-500 text-sm font-bold">Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
