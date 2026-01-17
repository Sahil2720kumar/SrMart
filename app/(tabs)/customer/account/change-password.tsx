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
import { router, Stack } from "expo-router"
import { LockIcon } from "@/assets/svgs/LockIcon"
import Svg, { Path } from "react-native-svg"
import { ShieldIcon } from "@/assets/svgs/ShieldIcon"
import { EyeIcon } from "@/assets/svgs/EyeIcon"




export default function UpdatePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = "New password must be different from current password"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdatePassword = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log("Password updated successfully")
      // Show success message or navigate back
      router.back()
    } catch (error) {
      console.error("Update password error:", error)
      setErrors({ currentPassword: "Current password is incorrect" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-8 pb-8">
            {/* Security Icon */}
            <View className="items-center mb-8 mt-4">
              <View className="w-32 h-32 rounded-full bg-green-50 items-center justify-center mb-4">
                <ShieldIcon width={60} height={60} />
              </View>
              <Text className="text-gray-900 text-xl font-bold text-center mb-2">
                Secure Your Account
              </Text>
              <Text className="text-gray-600 text-sm text-center px-4">
                Keep your account safe by updating your password regularly
              </Text>
            </View>

            {/* Form Fields */}
            {/* Current Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">
                Current Password
              </Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${errors.currentPassword ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <LockIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                  placeholder="Enter current password"
                  placeholderTextColor="#9ca3af"
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text)
                    if (errors.currentPassword) setErrors({ ...errors, currentPassword: undefined })
                  }}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <EyeIcon visible={showCurrentPassword} />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text className="text-red-400 text-xs mt-1 ml-1">{errors.currentPassword}</Text>
              )}
            </View>

            {/* New Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">
                New Password
              </Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${errors.newPassword ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <LockIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text)
                    if (errors.newPassword) setErrors({ ...errors, newPassword: undefined })
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <EyeIcon visible={showNewPassword} />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text className="text-red-400 text-xs mt-1 ml-1">{errors.newPassword}</Text>
              )}
              {!errors.newPassword && newPassword && (
                <Text className="text-gray-500 text-xs mt-1 ml-1">
                  Must be at least 8 characters
                </Text>
              )}
            </View>

            {/* Confirm New Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-900 mb-2 ml-1">
                Confirm New Password
              </Text>
              <View
                className={`flex-row items-center bg-white rounded-2xl px-4 border-2 ${errors.confirmPassword ? "border-red-400" : "border-gray-300"
                  }`}
              >
                <LockIcon />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-gray-900 text-base bg-white"
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text)
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Password Requirements */}
            <View className="bg-green-50 rounded-2xl p-4 mb-4">
              <Text className="text-green-800 text-sm font-semibold mb-2">
                Password Requirements:
              </Text>
              <View className="space-y-1">
                <Text className="text-green-700 text-xs">• At least 8 characters long</Text>
                <Text className="text-green-700 text-xs">• Different from current password</Text>
                <Text className="text-green-700 text-xs">• Contains letters and numbers (recommended)</Text>
              </View>
            </View>


            {/* Fixed Bottom Button */}
            <View className="flex-auto py-4 bg-white border-t border-gray-100 ">
              <TouchableOpacity
                onPress={handleUpdatePassword}
                disabled={isLoading}
                className="bg-green-500 py-4 rounded-2xl items-center active:opacity-80 shadow-lg"
                activeOpacity={0.8}
                style={{
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold">Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView >
  )
}