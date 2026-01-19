import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddBankAccountScreen() {
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!accountHolder.trim()) {
      newErrors.accountHolder = 'Account holder name is required';
    }
    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    if (!accountNumber.trim() || accountNumber.length < 9) {
      newErrors.accountNumber = 'Valid account number is required';
    }
    if (!ifscCode.trim() || ifscCode.length !== 11) {
      newErrors.ifscCode = 'Valid IFSC code is required (11 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all fields correctly');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[v0] Bank account submitted:', { accountHolder, bankName, accountNumber, ifscCode });
      Alert.alert(
        'Success',
        `Bank account added successfully!\n\nYour account will be verified within 24 hours. You'll receive a notification once verification is complete.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    console.log('[v0] Going back to bank details screen');
    router.back()
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Feather name='chevron-left' size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Add Bank Account</Text>
          <Text className="text-sm text-gray-600 mt-1">Secure payment method</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pt-6 pb-8">
          {/* Security Badge */}
          <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <Text className="text-emerald-900 font-bold text-sm mb-1">Secure & Encrypted</Text>
            <Text className="text-emerald-800 text-xs">
              Your bank details are encrypted and stored securely.
            </Text>
          </View>

          {/* Account Holder Name */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold text-sm mb-2">Account Holder Name</Text>
            <TextInput
              value={accountHolder}
              onChangeText={setAccountHolder}
              placeholder="As per your bank records"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
              placeholderTextColor="#9ca3af"
            />
            {errors.accountHolder && (
              <View className="flex-row items-center gap-2 mt-2">
                <Feather name='alert-circle' size={16} color="#dc2626" />
                <Text className="text-red-600 text-xs font-medium">{errors.accountHolder}</Text>
              </View>
            )}
          </View>

          {/* Bank Name */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold text-sm mb-2">Bank Name</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g., HDFC Bank, ICICI Bank"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
              placeholderTextColor="#9ca3af"
            />
            {errors.bankName && (
              <View className="flex-row items-center gap-2 mt-2">
                <Feather name='alert-circle' size={16} color="#dc2626" />
                <Text className="text-red-600 text-xs font-medium">{errors.bankName}</Text>
              </View>
            )}
          </View>

          {/* Account Number */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold text-sm mb-2">Account Number</Text>
            <TextInput
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter your account number"
              keyboardType="numeric"
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
              placeholderTextColor="#9ca3af"
            />
            {errors.accountNumber && (
              <View className="flex-row items-center gap-2 mt-2">
                <Feather name='alert-circle' size={16} color="#dc2626" />
                <Text className="text-red-600 text-xs font-medium">{errors.accountNumber}</Text>
              </View>
            )}
          </View>

          {/* IFSC Code */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold text-sm mb-2">IFSC Code</Text>
            <TextInput
              value={ifscCode}
              onChangeText={text => setIfscCode(text.toUpperCase())}
              placeholder="11-character IFSC code"
              maxLength={11}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
              placeholderTextColor="#9ca3af"
            />
            {errors.ifscCode && (
              <View className="flex-row items-center gap-2 mt-2">
                <Feather name='alert-circle' size={16} color="#dc2626" />
                <Text className="text-red-600 text-xs font-medium">{errors.ifscCode}</Text>
              </View>
            )}
          </View>

          {/* Admin Approval Notice */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <Text className="text-blue-900 font-bold text-sm mb-1">Admin Verification Required</Text>
            <Text className="text-blue-800 text-xs leading-5">
              Your bank account will be verified by our team within 24 hours. Once approved, you'll be able to request cashouts.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="bg-white px-4 py-4 border-t border-gray-100 safe-area-bottom">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className={`bg-emerald-500 rounded-xl py-4 items-center justify-center ${isLoading ? 'opacity-50' : ''}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Submit & Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
