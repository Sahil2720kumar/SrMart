import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  useVendorBankDetails,
  useUpdateVendorBankDetails,
} from '@/hooks/queries';
import { useAuthStore } from '@/store/authStore';
import { FullPageError } from '@/components/ErrorComp';
import { BankAccountType } from '@/types/payments-wallets.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AccountTypeOption = {
  value: BankAccountType;
  label: string;
};

const ACCOUNT_TYPES: AccountTypeOption[] = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current Account' },
];

// ---------------------------------------------------------------------------
// Reusable Confirm Modal
// ---------------------------------------------------------------------------
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmStyle?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmStyle = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const confirmBg = confirmStyle === 'danger' ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <View
            className={`h-1 w-full ${
              confirmStyle === 'danger' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          />
          <View className="p-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm leading-6">{message}</Text>
          </View>
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-gray-600 font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 py-4 items-center ${confirmBg} ${loading ? 'opacity-60' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function UpdateBankAccountScreen() {
  const { vendorBankId } = useLocalSearchParams();
  const { session } = useAuthStore();

  const {
    data: existingBankDetails,
    isLoading: isLoadingBank,
    isError,
    error,
    refetch,
  } = useVendorBankDetails(session?.user.id!);

  const updateBankMutation = useUpdateVendorBankDetails();

  // Form state
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

  // Modal state
  const [submitModalVisible, setSubmitModalVisible] = useState(false);

  const isEditMode = !!existingBankDetails;

  // Populate form if editing
  useEffect(() => {
    if (existingBankDetails) {
      setAccountHolder(existingBankDetails.account_holder_name);
      setBankName(existingBankDetails.bank_name);
      setAccountNumber(existingBankDetails.account_number);
      setConfirmAccountNumber(existingBankDetails.account_number);
      setIfscCode(existingBankDetails.ifsc_code);
      setBranch(existingBankDetails.branch || '');
      setAccountType(existingBankDetails.account_type || 'savings');
      setUpiId(existingBankDetails.upi_id || '');
    }
  }, [existingBankDetails]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
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
      newErrors.accountNumber = 'Account number must be 9–18 digits';
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

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSubmitPress = () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix all errors before submitting.',
        position: 'top',
      });
      return;
    }

    if (!session?.user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Session Error',
        text2: 'Vendor information not found. Please log in again.',
        position: 'top',
      });
      return;
    }

    // Show confirmation modal before submitting
    setSubmitModalVisible(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      const bankDetails = {
        vendor_id: session!.user.id,
        account_holder_name: accountHolder.trim(),
        account_number: accountNumber.trim(),
        bank_name: bankName.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        branch: branch.trim() || undefined,
        account_type: accountType,
        upi_id: upiId.trim() || undefined,
      };

      if (isEditMode && existingBankDetails) {
        await updateBankMutation.mutateAsync({
          id: existingBankDetails.id,
          ...bankDetails,
        });
      }

      setSubmitModalVisible(false);

      Toast.show({
        type: 'success',
        text1: 'Bank Details Updated',
        text2: 'Your information will be re-verified within 24 hours.',
        position: 'top',
        visibilityTime: 3500,
      });

      // Brief delay so the toast is visible before navigating back
      setTimeout(() => router.back(), 1200);
    } catch (err: any) {
      console.error('Bank account submission error:', err);
      setSubmitModalVisible(false);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err?.message || 'Failed to save bank details. Please try again.',
        position: 'top',
      });
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (isLoadingBank) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <FullPageError
        code="500"
        message={error?.message || 'Failed to load bank details'}
        onActionPress={refetch}
      />
    );
  }

  const isLoading = updateBankMutation.isPending;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* ── Header ── */}
        <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
          <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
            <Feather name="chevron-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Update Bank Account' : 'Something Is Wrong'}
            </Text>
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
                  <Text className="text-emerald-900 font-bold text-sm mb-1">
                    Secure & Encrypted
                  </Text>
                  <Text className="text-emerald-800 text-xs">
                    Your bank details are encrypted and stored securely using
                    industry-standard protocols.
                  </Text>
                </View>
              </View>
            </View>

            {/* Rejection Notice */}
            {existingBankDetails?.status === 'rejected' && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <View className="flex-row items-start gap-3">
                  <Ionicons name="close-circle" size={20} color="#dc2626" />
                  <View className="flex-1">
                    <Text className="text-red-900 font-bold text-sm mb-1">
                      Previous Submission Rejected
                    </Text>
                    {existingBankDetails.rejection_reason && (
                      <Text className="text-red-800 text-xs mb-2">
                        Reason: {existingBankDetails.rejection_reason}
                      </Text>
                    )}
                    <Text className="text-red-700 text-xs">
                      Please review and correct the information below.
                    </Text>
                  </View>
                </View>
              </View>
            )}

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
                  <Feather name="alert-circle" size={16} color="#dc2626" />
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
                  <Feather name="alert-circle" size={16} color="#dc2626" />
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
                    {ACCOUNT_TYPES.find((t) => t.value === accountType)?.label}
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
                        <Text
                          className={`font-medium ${
                            accountType === type.value
                              ? 'text-emerald-700'
                              : 'text-gray-900'
                          }`}
                        >
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
                  <Feather name="alert-circle" size={16} color="#dc2626" />
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
                  <Feather name="alert-circle" size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">
                    {errors.confirmAccountNumber}
                  </Text>
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
                onChangeText={(text) => setIfscCode(text.toUpperCase())}
                placeholder="e.g., HDFC0001234"
                maxLength={11}
                autoCapitalize="characters"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
              />
              {errors.ifscCode && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name="alert-circle" size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.ifscCode}</Text>
                </View>
              )}
              <Text className="text-gray-500 text-xs mt-1">
                You can find the IFSC code on your cheque or passbook
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
                  <Feather name="alert-circle" size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.upiId}</Text>
                </View>
              )}
              <Text className="text-gray-500 text-xs mt-1">
                For faster payouts (if available)
              </Text>
            </View>

            {/* Admin Approval Notice */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <View className="flex-row items-start gap-3">
                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                <View className="flex-1">
                  <Text className="text-blue-900 font-bold text-sm mb-1">
                    {isEditMode ? 'Re-verification Required' : 'Admin Verification Required'}
                  </Text>
                  <Text className="text-blue-800 text-xs leading-5">
                    Your updated bank account will be re-verified by our team within 24 hours.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Submit Button ── */}
        <View className="bg-white px-4 py-4 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSubmitPress}
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
                <Text className="text-white font-bold text-base">
                  {isEditMode ? 'Update & Re-verify' : 'Submit & Verify'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Submit Confirmation Modal ── */}
      <ConfirmModal
        visible={submitModalVisible}
        title={isEditMode ? 'Update Bank Account?' : 'Submit Bank Account?'}
        message={
          isEditMode
            ? 'Your bank details will be updated and sent for re-verification. Payouts may be paused until the review is complete.'
            : 'Your bank details will be submitted for admin verification. This usually takes up to 24 hours.'
        }
        confirmLabel={isEditMode ? 'Update' : 'Submit'}
        confirmStyle="primary"
        loading={updateBankMutation.isPending}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitModalVisible(false)}
      />
    </SafeAreaView>
  );
}