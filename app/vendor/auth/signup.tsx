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

export default function SignupScreen() {
  const [vendorName, setVendorName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }

    if (!shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all fields and try again');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[v0] Signup attempt:', { vendorName, shopName, phone, email });
      
      // Navigate to OTP verification
      router.push({
        pathname: '/vendor/auth/verify-otp',
        params: { phone: phone, type: 'signup' }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 px-6 pt-8 pb-6">
            {/* Header */}
            <View className="flex-row items-center mb-8">
              <TouchableOpacity onPress={handleLogin} className="p-2 -ml-2">
                <Feather name="chevron-left" size={24} color="#1f2937" />
              </TouchableOpacity>
              <View className="ml-2">
                <Text className="text-2xl font-bold text-gray-900">Create Account</Text>
                <Text className="text-gray-600 text-sm mt-1">Join our vendor community</Text>
              </View>
            </View>

            {/* Progress Indicator */}
            <View className="flex-row items-center justify-center mb-8">
              <View className="flex-row items-center">
                <View className="bg-emerald-500 w-8 h-8 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-sm">1</Text>
                </View>
                <View className="w-12 h-1 bg-gray-300 mx-2" />
                <View className="bg-gray-300 w-8 h-8 rounded-full items-center justify-center">
                  <Text className="text-gray-600 font-bold text-sm">2</Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Vendor Name */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Your Name</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="user" size={20} color="#6b7280" />
                  <TextInput
                    value={vendorName}
                    onChangeText={(text) => {
                      setVendorName(text);
                      if (errors.vendorName) setErrors({ ...errors, vendorName: '' });
                    }}
                    placeholder="Enter your full name"
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                {errors.vendorName && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.vendorName}</Text>
                  </View>
                )}
              </View>

              {/* Shop Name */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Shop Name</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="shopping-bag" size={20} color="#6b7280" />
                  <TextInput
                    value={shopName}
                    onChangeText={(text) => {
                      setShopName(text);
                      if (errors.shopName) setErrors({ ...errors, shopName: '' });
                    }}
                    placeholder="Enter your shop name"
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                {errors.shopName && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.shopName}</Text>
                  </View>
                )}
              </View>

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

              {/* Email */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Email Address</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="mail" size={20} color="#6b7280" />
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                {errors.email && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.email}</Text>
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
                    placeholder="Create a strong password"
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

              {/* Confirm Password */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">Confirm Password</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Re-enter your password"
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.confirmPassword}</Text>
                  </View>
                )}
              </View>

              {/* Terms and Conditions */}
              <View className="mt-4">
                <TouchableOpacity
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                  className="flex-row items-start gap-3"
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mt-0.5 ${
                      agreeToTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400'
                    }`}
                  >
                    {agreeToTerms && <Feather name="check" size={14} color="#fff" />}
                  </View>
                  <Text className="flex-1 text-gray-700 text-sm leading-5">
                    I agree to the{' '}
                    <Text className="text-emerald-600 font-semibold">Terms & Conditions</Text> and{' '}
                    <Text className="text-emerald-600 font-semibold">Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                {errors.terms && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.terms}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              className={`bg-emerald-500 rounded-xl py-4 items-center justify-center mt-8 shadow-md ${
                isLoading ? 'opacity-50' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-base">Continue</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-gray-600 text-sm">Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text className="text-emerald-600 font-bold text-sm">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}