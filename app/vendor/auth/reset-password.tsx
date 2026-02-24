import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// ─── Reusable Confirmation Modal ─────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDestructive?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDestructive = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="bg-white w-full rounded-2xl overflow-hidden" onPress={() => {}}>
          <View className="items-center pt-6 pb-2">
            <View
              className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
                confirmDestructive ? 'bg-red-100' : 'bg-emerald-100'
              }`}
            >
              {icon ?? (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={confirmDestructive ? '#dc2626' : '#10b981'}
                />
              )}
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center px-4">{title}</Text>
          </View>

          <Text className="text-sm text-gray-500 text-center px-6 pb-6 mt-1">{message}</Text>

          <View className="border-t border-gray-100 flex-row">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-base font-semibold text-gray-600">{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} className="flex-1 py-4 items-center">
              <Text
                className={`text-base font-bold ${
                  confirmDestructive ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successModalVisible, setSuccessModalVisible] = useState(false);

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
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please check all fields and try again.',
        position: 'top',
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Show success modal instead of Alert
      setSuccessModalVisible(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: 'Failed to reset password. Please try again.',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Success Modal */}
      <ConfirmModal
        visible={successModalVisible}
        title="Password Reset!"
        message="Your password has been reset successfully. Please login with your new password."
        confirmLabel="Login Now"
        cancelLabel="Stay"
        icon={<Ionicons name="lock-closed" size={28} color="#10b981" />}
        onConfirm={() => {
          setSuccessModalVisible(false);
          router.replace('/vendor/auth/login');
        }}
        onCancel={() => setSuccessModalVisible(false)}
      />

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
                <View
                  className={`flex-row items-center bg-white border rounded-xl px-4 py-1 ${
                    errors.newPassword ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    value={newPassword}
                    onChangeText={text => {
                      setNewPassword(text);
                      if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                    }}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Feather
                      name={showNewPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#6b7280"
                    />
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
                      <Text className="text-xs font-bold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </Text>
                    </View>
                    <View className="flex-row gap-1">
                      {[1, 2, 3, 4, 5].map(level => (
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
                <View
                  className={`flex-row items-center bg-white border rounded-xl px-4 py-1 ${
                    errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  <Feather name="lock" size={20} color="#6b7280" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={text => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Re-enter new password"
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 py-3 px-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Feather
                      name={showConfirmPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name="alert-circle" size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">
                      {errors.confirmPassword}
                    </Text>
                  </View>
                )}

                {/* Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View className="flex-row items-center gap-2 mt-2">
                    {newPassword === confirmPassword ? (
                      <>
                        <Feather name="check-circle" size={16} color="#10b981" />
                        <Text className="text-emerald-600 text-xs font-medium">
                          Passwords match
                        </Text>
                      </>
                    ) : (
                      <>
                        <Feather name="x-circle" size={16} color="#dc2626" />
                        <Text className="text-red-600 text-xs font-medium">
                          Passwords don't match
                        </Text>
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
                  {[
                    {
                      met: newPassword.length >= 8,
                      label: 'At least 8 characters',
                    },
                    {
                      met: /[A-Z]/.test(newPassword),
                      label: 'One uppercase letter',
                    },
                    {
                      met: /[a-z]/.test(newPassword),
                      label: 'One lowercase letter',
                    },
                    {
                      met: /\d/.test(newPassword),
                      label: 'One number',
                    },
                  ].map(({ met, label }) => (
                    <View key={label} className="flex-row items-center gap-2">
                      <Feather
                        name={met ? 'check-circle' : 'circle'}
                        size={16}
                        color={met ? '#10b981' : '#9ca3af'}
                      />
                      <Text className="text-blue-800 text-xs">{label}</Text>
                    </View>
                  ))}
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
                      Choose a unique password that you don't use anywhere else. Never share your
                      password with anyone.
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