import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  useVendorBankDetails,
  useDeleteVendorBankDetails,
} from '@/hooks/queries';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { FullPageError } from '@/components/ErrorComp';
import { VendorBankDetails } from '@/types/payments-wallets.types';
import { LinearGradient } from 'expo-linear-gradient';

// ---------------------------------------------------------------------------
// Reusable Confirmation Modal
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
  const confirmBg =
    confirmStyle === 'danger'
      ? 'bg-red-500'
      : 'bg-emerald-500';

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
        {/* Prevent tap-through on the card */}
        <Pressable className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Header accent */}
          <View
            className={`h-1 w-full ${
              confirmStyle === 'danger' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          />

          <View className="p-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm leading-6">{message}</Text>
          </View>

          {/* Actions */}
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
              className={`flex-1 py-4 items-center ${confirmBg} ${
                loading ? 'opacity-60' : ''
              }`}
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
export default function BankDetailsScreen() {
  const { user } = useProfileStore();
  const { session } = useAuthStore();

  const {
    data: bankDetails,
    isLoading: isLoadingBank,
    isError,
    error,
    refetch,
  } = useVendorBankDetails(session?.user?.id!);

  const deleteBankMutation = useDeleteVendorBankDetails();

  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bankExistsModalVisible, setBankExistsModalVisible] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddBankAccount = () => {
    if (bankDetails) {
      setBankExistsModalVisible(true);
      return;
    }
    router.push('/vendor/profile/documents/bank/add');
  };

  const handleEditBankAccount = () => {
    if (!bankDetails) {
      Toast.show({
        type: 'error',
        text1: 'No Bank Account',
        text2: 'Please add a bank account first.',
        position: 'top',
      });
      return;
    }
    router.push('/vendor/profile/documents/bank/update');
  };

  const handleConfirmDelete = async () => {
    if (!bankDetails) return;
    try {
      await deleteBankMutation.mutateAsync({
        id: bankDetails.id,
        vendor_id: session?.user.id!,
      });
      setDeleteModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Bank Account Deleted',
        text2: 'Your bank account has been removed successfully.',
        position: 'top',
      });
    } catch (err: any) {
      setDeleteModalVisible(false);
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: err?.message || 'Failed to delete bank account. Please try again.',
        position: 'top',
      });
    }
  };

  const handleViewDetails = () => {
    if (!bankDetails) return;

    const statusText =
      bankDetails.status === 'approved'
        ? 'Verified'
        : bankDetails.status === 'pending'
        ? 'Pending Verification'
        : bankDetails.status === 'rejected'
        ? 'Rejected'
        : 'Not Added';

    Toast.show({
      type: 'info',
      text1: `${bankDetails.bank_name}  •  ${statusText}`,
      text2: `${bankDetails.account_holder_name}  ·  ${bankDetails.ifsc_code}`,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const getStatusBadge = (status: VendorBankDetails['status']) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Verified' };
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Not Added' };
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '••••' + accountNumber.slice(-4);
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (isLoadingBank) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading bank details...</Text>
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

  const statusBadge = bankDetails ? getStatusBadge(bankDetails.status) : null;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Feather name="chevron-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Bank & Payout</Text>
          <Text className="text-sm text-gray-600 mt-1">Manage your bank details</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {bankDetails ? (
          <>
            {/* ── Current Bank Account Card ── */}
            <View className="px-4 pt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Current Bank Account
              </Text>

              <LinearGradient
                colors={['#eff6ff', '#dbeafe']}
                style={{ borderRadius: 16 }}
                className="rounded-2xl p-5 border border-blue-200 mb-4"
              >
                {/* Rejection Notice */}
                {bankDetails.status === 'rejected' && (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <View className="flex-row items-start gap-2">
                      <Ionicons name="close-circle" size={18} color="#dc2626" />
                      <View className="flex-1">
                        <Text className="text-red-900 font-bold text-xs mb-1">
                          Verification Rejected
                        </Text>
                        {bankDetails.rejection_reason && (
                          <Text className="text-red-700 text-xs">
                            {bankDetails.rejection_reason}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Bank Name */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">BANK NAME</Text>
                  <Text className="text-gray-900 font-bold text-lg">{bankDetails.bank_name}</Text>
                </View>

                {/* Account Holder */}
                <View className="mb-4 pb-4 border-b border-blue-300">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">ACCOUNT HOLDER</Text>
                  <Text className="text-gray-900 font-semibold text-base">
                    {bankDetails.account_holder_name}
                  </Text>
                </View>

                {bankDetails.account_type && (
                  <View className="mb-4 pb-4 border-b border-blue-300">
                    <Text className="text-gray-600 text-xs font-semibold mb-1">ACCOUNT TYPE</Text>
                    <Text className="text-gray-900 font-semibold text-base capitalize">
                      {bankDetails.account_type}
                    </Text>
                  </View>
                )}

                {/* Account Number */}
                <View className="mb-4 pb-4 border-b border-blue-300">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">ACCOUNT NUMBER</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-semibold text-base">
                      {showAccountNumber
                        ? bankDetails.account_number
                        : maskAccountNumber(bankDetails.account_number)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAccountNumber(!showAccountNumber)}
                    >
                      <Feather
                        name={showAccountNumber ? 'eye-off' : 'eye'}
                        size={18}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* IFSC */}
                <View className="mb-4 pb-4 border-b border-blue-300">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">IFSC CODE</Text>
                  <Text className="text-gray-900 font-semibold text-base">
                    {bankDetails.ifsc_code}
                  </Text>
                </View>

                {bankDetails.branch && (
                  <View className="mb-4 pb-4 border-b border-blue-300">
                    <Text className="text-gray-600 text-xs font-semibold mb-1">BRANCH</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {bankDetails.branch}
                    </Text>
                  </View>
                )}

                {bankDetails.upi_id && (
                  <View className="mb-4 pb-4 border-b border-blue-300">
                    <Text className="text-gray-600 text-xs font-semibold mb-1">UPI ID</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {bankDetails.upi_id}
                    </Text>
                  </View>
                )}

                {/* Verification Status */}
                <View className="bg-white/60 rounded-lg p-3 flex-row items-center justify-between mb-3">
                  <Text className="text-gray-600 text-xs font-semibold">Verification Status</Text>
                  {statusBadge && (
                    <View className={`${statusBadge.bg} px-3 py-1.5 rounded-full`}>
                      <Text className={`${statusBadge.text} text-xs font-bold`}>
                        {statusBadge.label}
                      </Text>
                    </View>
                  )}
                </View>

                {bankDetails.verified_at && (
                  <Text className="text-gray-500 text-xs">
                    Verified on: {new Date(bankDetails.verified_at).toLocaleDateString()}
                  </Text>
                )}
                <Text className="text-gray-500 text-xs">
                  Last updated: {new Date(bankDetails.updated_at).toLocaleDateString()}
                </Text>
              </LinearGradient>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  onPress={handleViewDetails}
                  className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-3 items-center justify-center active:opacity-70"
                >
                  <View className="flex-row items-center gap-2">
                    <Feather name="eye" size={16} color="#3b82f6" />
                    <Text className="text-blue-700 font-bold text-sm">View Details</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleEditBankAccount}
                  disabled={deleteBankMutation.isPending}
                  className="flex-1 bg-emerald-500 rounded-xl py-3 items-center justify-center active:opacity-70"
                >
                  <View className="flex-row items-center gap-2">
                    <Feather name="edit-3" size={16} color="#fff" />
                    <Text className="text-white font-bold text-sm">Edit</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(true)}
                  disabled={deleteBankMutation.isPending}
                  className={`bg-red-50 border border-red-200 rounded-xl px-4 py-3 items-center justify-center active:opacity-70 ${
                    deleteBankMutation.isPending ? 'opacity-50' : ''
                  }`}
                >
                  {deleteBankMutation.isPending ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Feather name="trash-2" size={16} color="#dc2626" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Banner */}
            <View className="px-4 mb-6">
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3">
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <View className="flex-1">
                    <Text className="text-blue-900 text-sm font-semibold mb-1">
                      Payout Information
                    </Text>
                    <Text className="text-blue-800 text-xs leading-5">
                      Payouts are credited to your bank account after admin verification and
                      approval. Settlement cycle is T+2 business days.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* ── No Bank Account ── */
          <View className="px-4 pt-6">
            <View className="items-center justify-center py-12">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Feather name="credit-card" size={48} color="#9ca3af" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                No Bank Account Added
              </Text>
              <Text className="text-sm text-gray-600 text-center mb-6 px-8">
                Add your bank account to receive payouts from your sales
              </Text>

              <TouchableOpacity
                onPress={handleAddBankAccount}
                className="bg-emerald-500 rounded-xl px-8 py-4 items-center justify-center active:opacity-70"
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="plus" size={20} color="#fff" />
                  <Text className="text-white font-bold text-base">Add Bank Account</Text>
                </View>
              </TouchableOpacity>

              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 mx-4">
                <View className="flex-row items-start gap-3">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <View>
                    <Text className="text-amber-900 text-sm font-semibold mb-1">
                      Verification Required
                    </Text>
                    <Text className="text-amber-800 text-xs leading-5">
                      Your bank account will be verified by our admin team within 24 hours
                      before you can receive payouts.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Help Section */}
        <View className="px-4 mb-8">
          <View className="bg-white rounded-2xl p-5 border border-gray-200">
            <View className="flex-row items-center gap-3 mb-3">
              <Ionicons name="help-circle-outline" size={24} color="#059669" />
              <Text className="text-gray-900 font-bold text-base">Need Help?</Text>
            </View>
            <Text className="text-gray-600 text-sm mb-4">
              Having trouble with bank verification or payouts? Our support team is here to help.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/vendor/(tabs)/profile/support')}
              className="bg-emerald-50 border border-emerald-200 rounded-lg py-3 items-center"
            >
              <Text className="text-emerald-700 font-bold text-sm">Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Modals ── */}

      {/* Delete confirmation */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Bank Account"
        message="Are you sure you want to delete this bank account? This action cannot be undone."
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteBankMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />

      {/* Bank already exists */}
      <ConfirmModal
        visible={bankExistsModalVisible}
        title="Bank Account Exists"
        message="You already have a bank account added. Would you like to update it instead?"
        confirmLabel="Update"
        confirmStyle="primary"
        onConfirm={() => {
          setBankExistsModalVisible(false);
          handleEditBankAccount();
        }}
        onCancel={() => setBankExistsModalVisible(false)}
      />
    </SafeAreaView>
  );
}