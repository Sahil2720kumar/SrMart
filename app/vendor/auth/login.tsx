import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Phone validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[v0] Login attempt:', { phone, password: '***' });
      Alert.alert('Success', 'Login successful!');
      // Navigate to main app
      // router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset link will be sent to your registered phone number');
  };

  const handleSignup = () => {
    router.push('/vendor/auth/signup');
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-emerald-50 to-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-12">
            {/* Logo/Brand Section */}
            <View className="items-center mb-12">
              <View className="bg-emerald-500 w-20 h-20 rounded-3xl items-center justify-center mb-4 shadow-lg">
                <Feather name="shopping-bag" size={40} color="#fff" />
              </View>
              <Text className="text-3xl font-bold text-gray-900">Vendor Portal</Text>
              <Text className="text-gray-600 text-base mt-2">Manage your shop with ease</Text>
            </View>

            {/* Welcome Text */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900">Welcome Back!</Text>
              <Text className="text-gray-600 text-base mt-2">Sign in to continue to your dashboard</Text>
            </View>

            {/* Form */}
            <View className="space-y-5">
              {/* Phone Number */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Phone Number</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="phone" size={20} color="#6b7280" />
                  <Text className="text-gray-600 font-medium mx-2">+91</Text>
                  <TextInput
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="98765 43210"
                    keyboardType="phone-pad"
                    maxLength={10}
                    className="flex-1 py-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                {errors.phone && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.phone}</Text>
                  </View>
                )}
              </View>

              {/* Password */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Password</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.password}</Text>
                  </View>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={handleForgotPassword} className="self-end">
                <Text className="text-emerald-600 font-semibold text-sm">Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`bg-emerald-500 rounded-xl py-4 items-center justify-center mt-8 shadow-md ${
                isLoading ? 'opacity-50' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
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
              <TouchableOpacity onPress={handleSignup}>
                <Text className="text-emerald-600 font-bold text-base">Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Help Section */}
            <View className="mt-auto pt-8 pb-6">
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3">
                  <Feather name="info" size={20} color="#2563eb" />
                  <View className="flex-1">
                    <Text className="text-blue-900 font-semibold text-sm mb-1">Need Help?</Text>
                    <Text className="text-blue-800 text-xs">
                      Contact support at support@vendorportal.com or call +91 1800-XXX-XXXX
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}