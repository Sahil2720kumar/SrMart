import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useVendorBankDetails,
  useDeleteVendorBankDetails 
} from '@/hooks/queries';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { FullPageError } from '@/components/ErrorComp';
import { VendorBankDetails } from '@/types/payments-wallets.types'; 
import { LinearGradient } from 'expo-linear-gradient';

export default function BankDetailsScreen() {
  const { user } = useProfileStore();
  const { session } = useAuthStore();

 

  // Fetch bank details
  const { 
    data: bankDetails,
    isLoading: isLoadingBank,
    isError,
    error,
    refetch
  } = useVendorBankDetails(session?.user?.id!);

  const deleteBankMutation = useDeleteVendorBankDetails();

  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const handleAddBankAccount = () => {
    if (bankDetails) {
      Alert.alert(
        'Bank Account Exists',
        'You already have a bank account added. You can update it instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update', onPress: handleEditBankAccount }
        ]
      );
      return;
    }
    console.log('[v0] Navigating to Add Bank Account screen');
    router.push("/vendor/profile/documents/bank/add");
  };

  const handleEditBankAccount = () => {
    if (!bankDetails) {
      Alert.alert('No Bank Account', 'Please add a bank account first.');
      return;
    }
    router.push("/vendor/profile/documents/bank/update"); 
  };

  const handleDeleteBankAccount = () => {
    if (!bankDetails) return;

    Alert.alert(
      'Delete Bank Account',
      'Are you sure you want to delete this bank account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBankMutation.mutateAsync({
                id: bankDetails.id,
                vendor_id: session?.user.id!
              });
              Alert.alert('Success', 'Bank account deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete bank account');
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = () => {
    if (!bankDetails) return;

    const statusText = 
      bankDetails.status === 'approved' ? 'Verified' :
      bankDetails.status === 'pending' ? 'Pending Verification' :
      bankDetails.status === 'rejected' ? 'Rejected' :
      'Not Added';

    Alert.alert(
      'Bank Account Details',
      `Bank: ${bankDetails.bank_name}\nAccount Holder: ${bankDetails.account_holder_name}\nAccount Type: ${bankDetails.account_type || 'N/A'}\nAccount Number: ${bankDetails.account_number}\nIFSC Code: ${bankDetails.ifsc_code}\nBranch: ${bankDetails.branch || 'N/A'}\nUPI ID: ${bankDetails.upi_id || 'N/A'}\nStatus: ${statusText}${bankDetails.rejection_reason ? `\nRejection Reason: ${bankDetails.rejection_reason}` : ''}`
    );
  };

  const handleGoBack = () => {
    console.log('[v0] Going back to profile overview');
    router.back();
  };

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
    const lastFour = accountNumber.slice(-4);
    return '••••' + lastFour;
  };

  // Loading state
  if (isLoadingBank) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading bank details...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <FullPageError 
      code='500'
        message={error?.message || "Failed to load bank details"}
        onActionPress={refetch}
      />
    );
  }

  const statusBadge = bankDetails ? getStatusBadge(bankDetails.status) : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Feather name='chevron-left' size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Bank & Payout</Text>
          <Text className="text-sm text-gray-600 mt-1">Manage your bank details</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {bankDetails ? (
          <>
            {/* Current Bank Account Card */}
            <View className="px-4 pt-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">Current Bank Account</Text>

              <LinearGradient colors={['#eff6ff','#dbeafe']} style={{borderRadius:16}} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 mb-4">
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

                {/* Bank Details */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">BANK NAME</Text>
                  <Text className="text-gray-900 font-bold text-lg">{bankDetails.bank_name}</Text>
                </View>

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

                <View className="mb-4 pb-4 border-b border-blue-300">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">ACCOUNT NUMBER</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-semibold text-base">
                      {showAccountNumber 
                        ? bankDetails.account_number 
                        : maskAccountNumber(bankDetails.account_number)
                      }
                    </Text>
                    <TouchableOpacity onPress={() => setShowAccountNumber(!showAccountNumber)}>
                      {showAccountNumber ? (
                        <Feather name='eye-off' size={18} color="#6b7280" />
                      ) : (
                        <Feather name='eye' size={18} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

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
                <View className="bg-white bg-opacity-60 rounded-lg p-3 flex-row items-center justify-between mb-3">
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
                    <Feather name='eye' size={16} color="#3b82f6" />
                    <Text className="text-blue-700 font-bold text-sm">View Details</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleEditBankAccount}
                  disabled={deleteBankMutation.isPending}
                  className="flex-1 bg-emerald-500 rounded-xl py-3 items-center justify-center active:opacity-70"
                >
                  <View className="flex-row items-center gap-2">
                    <Feather name='edit-3' size={16} color="#fff" />
                    <Text className="text-white font-bold text-sm">Edit</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteBankAccount}
                  disabled={deleteBankMutation.isPending}
                  className={`bg-red-50 border border-red-200 rounded-xl px-4 py-3 items-center justify-center active:opacity-70 ${
                    deleteBankMutation.isPending ? 'opacity-50' : ''
                  }`}
                >
                  {deleteBankMutation.isPending ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Feather name='trash-2' size={16} color="#dc2626" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Banner */}
            <View className="px-4 mb-6">
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 bg-em">
                <View className="flex-row items-start gap-3">
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <View className="flex-1">
                    <Text className="text-blue-900 text-sm font-semibold mb-1">
                      Payout Information
                    </Text>
                    <Text className="text-blue-800 text-xs leading-5">
                      Payouts are credited to your bank account after admin verification and approval. 
                      Settlement cycle is T+2 business days.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* No Bank Account - Add Section */
          <View className="px-4 pt-6">
            <View className="items-center justify-center py-12">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Feather name='credit-card' size={48} color="#9ca3af" />
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
                  <Feather name='plus' size={20} color="#fff" />
                  <Text className="text-white font-bold text-base">Add Bank Account</Text>
                </View>
              </TouchableOpacity>

              {/* Info Box */}
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-8 mx-4">
                <View className="flex-row items-start gap-3">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <View className="">
                    <Text className="text-amber-900 text-sm font-semibold mb-1">
                      Verification Required
                    </Text>
                    <Text className="text-amber-800 text-xs leading-5">
                      Your bank account will be verified by our admin team within
                      24h hours before you can receive payouts.
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
    </SafeAreaView>
  );
}