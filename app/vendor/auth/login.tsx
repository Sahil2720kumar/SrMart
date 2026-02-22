import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function LoginScreen() {
  const { setSession } = useAuthStore()
  const { setUser, setVendorProfile } = useProfileStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!emailRegex.test(email)) newErrors.email = 'Enter a valid email address'
    if (!password.trim()) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (signInError) throw signInError
      if (!signInData.session || !signInData.user) throw new Error('Login failed')

      const authUserId = signInData.user.id

      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('auth_id', authUserId).maybeSingle()
      if (userError) throw userError
      if (!userData) throw new Error('User profile not found')
      if (userData.role !== 'vendor') throw new Error('This account is not a vendor')

      const { data: vendorData, error: vendorError } = await supabase.from('vendors').select('*').eq('user_id', authUserId).maybeSingle()
      if (vendorError) throw vendorError
      if (!vendorData) throw new Error('Vendor profile not found')

      setSession(signInData.session)
      setUser(userData)
      setVendorProfile(vendorData)

      Toast.show({ type: 'success', text1: 'Welcome back! 👋', text2: 'Signed in successfully.', position: 'top' })

      router.replace('/vendor/dashboard')
    } catch (error: any) {
      console.error('Vendor login error:', error?.message)
      Toast.show({ type: 'error', text1: 'Login Failed', text2: error?.message || 'Invalid email or password.', position: 'top' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    Toast.show({ type: 'info', text1: 'Forgot Password', text2: 'Password reset link will be sent to your registered email.', position: 'top' })
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-emerald-50 to-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="flex-1 px-6 pt-12">
            {/* Logo */}
            <View className="items-center mb-12">
              <View className="bg-emerald-500 w-20 h-20 rounded-3xl items-center justify-center mb-4 shadow-lg">
                <Feather name="shopping-bag" size={40} color="#fff" />
              </View>
              <Text className="text-3xl font-bold text-gray-900">Vendor Portal</Text>
              <Text className="text-gray-600 text-base mt-2">Manage your shop with ease</Text>
            </View>

            {/* Welcome */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900">Welcome Back!</Text>
              <Text className="text-gray-600 text-base mt-2">Sign in to continue to your dashboard</Text>
            </View>

            <View className="space-y-5">
              {/* Email */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Email Address</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="mail" size={20} color="#6b7280" />
                  <TextInput
                    value={email}
                    onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: '' }) }}
                    placeholder="xyz@vendor.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                {errors.email && <View className="flex-row items-center gap-2 mt-2"><Feather name="alert-circle" size={16} color="#dc2626" /><Text className="text-red-600 text-xs font-medium">{errors.email}</Text></View>}
              </View>

              {/* Password */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Password</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    value={password}
                    onChangeText={(t) => { setPassword(t); if (errors.password) setErrors({ ...errors, password: '' }) }}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {errors.password && <View className="flex-row items-center gap-2 mt-2"><Feather name="alert-circle" size={16} color="#dc2626" /><Text className="text-red-600 text-xs font-medium">{errors.password}</Text></View>}
              </View>

              <TouchableOpacity onPress={handleForgotPassword} className="self-end">
                <Text className="text-emerald-600 font-semibold text-sm">Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={isLoading} className={`bg-emerald-500 rounded-xl py-4 items-center justify-center mt-8 shadow-md ${isLoading ? 'opacity-50' : ''}`}>
              {isLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-base">Sign In</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="text-gray-500 font-medium px-4">OR</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/vendor/auth/signup')}>
                <Text className="text-emerald-600 font-bold text-base">Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Help */}
            <View className="mt-auto pt-8 pb-6">
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3">
                  <Feather name="info" size={20} color="#2563eb" />
                  <View className="flex-1">
                    <Text className="text-blue-900 font-semibold text-sm mb-1">Need Help?</Text>
                    <Text className="text-blue-800 text-xs">Contact support at support@vendorportal.com or call +91 1800-XXX-XXXX</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}