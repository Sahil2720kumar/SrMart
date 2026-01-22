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

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: '#dc2626' };
    if (strength <= 3) return { strength, label: 'Fair', color: '#f59e0b' };
    if (strength <= 4) return { strength, label: 'Good', color: '#3b82f6' };
    return { strength, label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all fields and try again');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[v0] Password reset successful');
      
      Alert.alert(
        'Success!',
        'Your password has been reset successfully. Please login with your new password.',
        [
          {
            text: 'Login Now',
            onPress: () => router.replace('/vendor/auth/login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
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
          <View className="flex-1 px-6 pt-8">
            {/* Header */}
            <View className="flex-row items-center mb-12">
              <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
                <Feather name="chevron-left" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {/* Icon & Title */}
            <View className="items-center mb-10">
              <View className="bg-emerald-100 w-24 h-24 rounded-full items-center justify-center mb-6 shadow-sm">
                <Feather name="lock" size={48} color="#10b981" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 text-center">
                Reset Password
              </Text>
              <Text className="text-gray-600 text-base mt-3 text-center px-4">
                Create a strong password to secure your account
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-5">
              {/* New Password */}
              <View>
                <Text className="text-gray-700 font-semibold text-sm mb-2">New Password</Text>
                <View className="flex-row items-center bg-white border border-gray-300 rounded-xl px-4 py-1">
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                    }}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Feather name={showNewPassword ? 'eye' : 'eye-off'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.newPassword}</Text>
                  </View>
                )}

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <View className="mt-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-600 text-xs font-medium">Password Strength</Text>
                      <Text
                        className="text-xs font-bold"
                        style={{ color: passwordStrength.color }}
                      >
                        {passwordStrength.label}
                      </Text>
                    </View>
                    <View className="flex-row gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <View
                          key={level}
                          className="flex-1 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              level <= passwordStrength.strength
                                ? passwordStrength.color
                                : '#e5e7eb',
                          }}
                        />
                      ))}
                    </View>
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
                    placeholder="Re-enter new password"
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
                
                {/* Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View className="flex-row items-center gap-2 mt-2">
                    {newPassword === confirmPassword ? (
                      <>
                        <Feather name="check-circle" size={16} color="#10b981" />
                        <Text className="text-emerald-600 text-xs font-medium">Passwords match</Text>
                      </>
                    ) : (
                      <>
                        <Feather name="x-circle" size={16} color="#dc2626" />
                        <Text className="text-red-600 text-xs font-medium">Passwords don't match</Text>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* Password Requirements */}
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                <Text className="text-blue-900 font-semibold text-sm mb-3">
                  Password Requirements:
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-center gap-2">
                    <Feather
                      name={newPassword.length >= 8 ? 'check-circle' : 'circle'}
                      size={16}
                      color={newPassword.length >= 8 ? '#10b981' : '#9ca3af'}
                    />
                    <Text className="text-blue-800 text-xs">At least 8 characters</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Feather
                      name={/[A-Z]/.test(newPassword) ? 'check-circle' : 'circle'}
                      size={16}
                      color={/[A-Z]/.test(newPassword) ? '#10b981' : '#9ca3af'}
                    />
                    <Text className="text-blue-800 text-xs">One uppercase letter</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Feather
                      name={/[a-z]/.test(newPassword) ? 'check-circle' : 'circle'}
                      size={16}
                      color={/[a-z]/.test(newPassword) ? '#10b981' : '#9ca3af'}
                    />
                    <Text className="text-blue-800 text-xs">One lowercase letter</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Feather
                      name={/\d/.test(newPassword) ? 'check-circle' : 'circle'}
                      size={16}
                      color={/\d/.test(newPassword) ? '#10b981' : '#9ca3af'}
                    />
                    <Text className="text-blue-800 text-xs">One number</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              className={`bg-emerald-500 rounded-xl py-4 items-center justify-center mt-8 shadow-md ${
                isLoading ? 'opacity-50' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-base">Reset Password</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Security Notice */}
            <View className="mt-auto pt-8 pb-6">
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3">
                  <Feather name="shield" size={20} color="#d97706" />
                  <View className="flex-1">
                    <Text className="text-amber-900 font-semibold text-sm mb-1">
                      Keep Your Account Safe
                    </Text>
                    <Text className="text-amber-800 text-xs leading-5">
                      Choose a unique password that you don't use anywhere else. Never share your password with anyone.
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