import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  useAddVendorBankDetails,
} from '@/hooks/queries';
import { useVendorDetail } from '@/hooks/queries';
import { useAuthStore } from '@/store/authStore';
import { BankAccountType } from '@/types/payments-wallets.types';

type AccountTypeOption = {
  value: BankAccountType;
  label: string;
};

const ACCOUNT_TYPES: AccountTypeOption[] = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current Account' },
];

export default function AddBankAccountScreen() {
  const { session } = useAuthStore();

  const {
    data: vendorData,
    isLoading: isLoadingVendor,
  } = useVendorDetail(session?.user?.id || '');

  const addBankMutation = useAddVendorBankDetails();

  // Form states
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('savings');
  const [upiId, setUpiId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!accountHolder.trim()) {
      newErrors.accountHolder = 'Account holder name is required';
    } else if (accountHolder.trim().length < 3) {
      newErrors.accountHolder = 'Name must be at least 3 characters';
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (accountNumber.length < 9 || accountNumber.length > 18) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    } else if (!/^\d+$/.test(accountNumber)) {
      newErrors.accountNumber = 'Account number must contain only digits';
    }

    if (!confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = 'Please confirm account number';
    } else if (accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (ifscCode.length !== 11) {
      newErrors.ifscCode = 'IFSC code must be 11 characters';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC code format';
    }

    if (upiId.trim() && !upiId.includes('@')) {
      newErrors.upiId = 'Invalid UPI ID format (should contain @)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix all errors before submitting.',
        position: 'top',
      });
      return;
    }

    if (!vendorData?.id || !session?.user.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Vendor information not found.',
        position: 'top',
      });
      return;
    }

    try {
      const bankDetails = {
        vendor_id: session?.user.id!,
        account_holder_name: accountHolder.trim(),
        account_number: accountNumber.trim(),
        bank_name: bankName.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        branch: branch.trim() || undefined,
        account_type: accountType,
        upi_id: upiId.trim() || undefined,
      };

      await addBankMutation.mutateAsync(bankDetails);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Bank account added successfully! Your account will be verified within 24 hours.',
        position: 'top',
      });
      router.back();
    } catch (error: any) {
      console.error('Bank account submission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save bank details. Please try again.',
        position: 'top',
      });
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoadingVendor) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  const isLoading = addBankMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-4 pt-6 pb-8">
            {/* Security Badge */}
            <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <View className="flex-row items-start gap-3">
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <View className="flex-1">
                  <Text className="text-emerald-900 font-bold text-sm mb-1">Secure & Encrypted</Text>
                  <Text className="text-emerald-800 text-xs">
                    Your bank details are encrypted and stored securely using industry-standard protocols.
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Holder Name */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Account Holder Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={accountHolder}
                onChangeText={setAccountHolder}
                placeholder="As per your bank records"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
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
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Bank Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                placeholder="e.g., HDFC Bank, ICICI Bank, SBI"
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

            {/* Account Type */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Account Type <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <TouchableOpacity
                  onPress={() => setShowAccountTypeDropdown(!showAccountTypeDropdown)}
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className="text-gray-900 font-medium">
                    {ACCOUNT_TYPES.find(t => t.value === accountType)?.label}
                  </Text>
                  <Feather
                    name={showAccountTypeDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>

                {showAccountTypeDropdown && (
                  <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl overflow-hidden z-10">
                    {ACCOUNT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        onPress={() => {
                          setAccountType(type.value);
                          setShowAccountTypeDropdown(false);
                        }}
                        className={`px-4 py-3 border-b border-gray-100 ${
                          accountType === type.value ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <Text className={`font-medium ${
                          accountType === type.value ? 'text-emerald-700' : 'text-gray-900'
                        }`}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Account Number */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Account Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Enter your account number"
                keyboardType="number-pad"
                maxLength={18}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />
              {errors.accountNumber && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name='alert-circle' size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.accountNumber}</Text>
                </View>
              )}
            </View>

            {/* Confirm Account Number */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Confirm Account Number <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={confirmAccountNumber}
                onChangeText={setConfirmAccountNumber}
                placeholder="Re-enter your account number"
                keyboardType="number-pad"
                maxLength={18}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
              />
              {errors.confirmAccountNumber && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name='alert-circle' size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.confirmAccountNumber}</Text>
                </View>
              )}
            </View>

            {/* IFSC Code */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                IFSC Code <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={ifscCode}
                onChangeText={text => setIfscCode(text.toUpperCase())}
                placeholder="e.g., HDFC0001234"
                maxLength={11}
                autoCapitalize="characters"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
              />
              {errors.ifscCode && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name='alert-circle' size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.ifscCode}</Text>
                </View>
              )}
              <Text className="text-gray-500 text-xs mt-1">
                You can find IFSC code on your cheque or passbook
              </Text>
            </View>

            {/* Branch (Optional) */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Branch Name (Optional)
              </Text>
              <TextInput
                value={branch}
                onChangeText={setBranch}
                placeholder="e.g., MG Road Branch"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* UPI ID (Optional) */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                UPI ID (Optional)
              </Text>
              <TextInput
                value={upiId}
                onChangeText={setUpiId}
                placeholder="yourname@upi"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
              />
              {errors.upiId && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name='alert-circle' size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.upiId}</Text>
                </View>
              )}
              <Text className="text-gray-500 text-xs mt-1">For faster payouts (if available)</Text>
            </View>

            {/* Admin Approval Notice */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <View className="flex-row items-start gap-3">
                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="text-blue-900 font-bold text-sm mb-1">
                    Admin Verification Required
                  </Text>
                  <Text className="text-blue-800 text-xs leading-5">
                    Your bank account will be verified by our team within 24 hours. Once approved,
                    you'll be able to request cashouts.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="bg-white px-4 py-4 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`bg-emerald-500 rounded-xl py-4 items-center justify-center ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Feather name="check" size={20} color="#fff" />
                <Text className="text-white font-bold text-base">Submit & Verify</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}