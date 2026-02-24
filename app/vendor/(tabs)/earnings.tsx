import { Entypo, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  useWalletData,
  useRequestCashout,
  useCancelCashout,
} from '@/hooks/queries/wallets';

import { useVendorProfile } from '@/hooks/queries';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import VerificationGate from '@/components/vendorVerificationComp';

export default function VendorEarningsScreen() {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  // Get vendor profile to get the vendor_id
  const { data: vendorProfile } = useVendorProfile(userId);
  const vendorId = vendorProfile?.user_id;

  // Fetch wallet data (userType: 'vendor', entityId: vendor_id)
  const { wallet, transactions, cashouts, bankDetails, isLoading } =
    useWalletData(userId, 'vendor', vendorId);

  // Mutations
  const requestCashout = useRequestCashout();
  const cancelCashout = useCancelCashout();

  // Local state
  const [cashoutModalVisible, setCashoutModalVisible] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [activeEarningsFilter, setActiveEarningsFilter] = useState<'today' | 'week' | 'month'>('today');
  const [showBankNumber, setShowBankNumber] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cancel cashout confirmation modal
  const [cancelModal, setCancelModal] = useState(false);
  const [cashoutIdToCancel, setCashoutIdToCancel] = useState<string | null>(null);

  // Confirm cashout modal (replaces Alert confirm dialog)
  const [confirmCashoutModal, setConfirmCashoutModal] = useState(false);
  const [pendingCashoutAmount, setPendingCashoutAmount] = useState(0);

  const verificationStatus = useMemo(() => {
    if (!vendorProfile) return { isAdminVerified: false, isKycVerified: false };
    return {
      isAdminVerified: vendorProfile.is_verified,
      isKycVerified: vendorProfile.kyc_status === 'approved',
    };
  }, [vendorProfile]);

  // Refetch all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      wallet.refetch(),
      transactions.refetch(),
      cashouts.refetch(),
      bankDetails.refetch(),
    ]);
    setRefreshing(false);
  };

  const handleRequestCashout = () => {
    if (!cashoutAmount || parseInt(cashoutAmount) === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid amount.',
        position: 'top',
      });
      return;
    }

    const amount = parseInt(cashoutAmount);

    if (amount > (wallet.data?.available_balance || 0)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Amount exceeds available balance.',
        position: 'top',
      });
      return;
    }

    if (amount < 1000) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Minimum cashout amount is ₹1,000.',
        position: 'top',
      });
      return;
    }

    if (!bankDetails.data?.is_verified) {
      Toast.show({
        type: 'error',
        text1: 'Bank Account Required',
        text2: bankDetails.data
          ? 'Your bank account is pending verification. Please wait for admin approval.'
          : 'Please add and verify a bank account first.',
        position: 'top',
      });
      return;
    }

    // Open confirm modal instead of Alert
    setPendingCashoutAmount(amount);
    setConfirmCashoutModal(true);
  };

  const handleConfirmCashout = async () => {
    try {
      await requestCashout.mutateAsync({
        wallet_id: wallet.data!.id,
        amount: pendingCashoutAmount,
      });
      setConfirmCashoutModal(false);
      setCashoutAmount('');
      setCashoutModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Cashout request of ₹${pendingCashoutAmount.toLocaleString()} submitted! It will be transferred within 2 business days.`,
        position: 'top',
      });
    } catch (error) {
      console.error('Cashout error:', error);
      setConfirmCashoutModal(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to process cashout request.',
        position: 'top',
      });
    }
  };

  const handleViewBankAccount = () => {
    if (!bankDetails.data) {
      Toast.show({
        type: 'info',
        text1: 'No Bank Account',
        text2: 'Please add a bank account first.',
        position: 'top',
      });
      return;
    }
    // Navigate to bank details view page
    router.push('/vendor/profile/documents/bank/update');
  };

  const handleEditBankAccount = () => {
    router.push('/vendor/profile/documents/bank/update');
  };

  const handleSettlementHistory = () => {
    Toast.show({
      type: 'info',
      text1: 'Settlement History',
      text2: 'Opening detailed settlement history...',
      position: 'top',
    });
  };

  const getEarningsAmount = () => {
    if (!wallet.data) return 0;
    switch (activeEarningsFilter) {
      case 'today': return wallet.data.earnings_today;
      case 'week': return wallet.data.earnings_this_week;
      case 'month': return wallet.data.earnings_this_month;
      default: return 0;
    }
  };

  const getEarningsLabel = () => {
    switch (activeEarningsFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week ';
      case 'month': return 'This Month';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case 'approved':
      case 'processing':
      case 'transferred':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'pending':
        return { bg: 'bg-orange-100', text: 'text-orange-700' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      case 'cancelled':
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleCancelCashout = (cashoutId: string) => {
    setCashoutIdToCancel(cashoutId);
    setCancelModal(true);
  };

  const confirmCancelCashout = async () => {
    if (!cashoutIdToCancel) return;
    try {
      await cancelCashout.mutateAsync(cashoutIdToCancel);
      setCancelModal(false);
      setCashoutIdToCancel(null);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Cashout request cancelled successfully.',
        position: 'top',
      });
    } catch (error) {
      console.error('Cancel cashout error:', error);
      setCancelModal(false);
      setCashoutIdToCancel(null);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to cancel cashout request.',
        position: 'top',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4">Loading wallet data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!wallet.data) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-gray-900 text-lg font-bold mt-4">Unable to Load Wallet</Text>
          <Text className="text-gray-600 text-center mt-2">
            There was an error loading your wallet. Please try again.
          </Text>
          <TouchableOpacity
            onPress={() => wallet.refetch()}
            className="bg-emerald-500 px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const walletData = wallet.data;
  const recentCashouts = cashouts.data || [];
  const recentTransactions = transactions.data || [];

  if (!verificationStatus.isAdminVerified || !verificationStatus.isKycVerified) {
    return (
      <VerificationGate
        isAdminVerified={verificationStatus.isAdminVerified}
        isKycVerified={verificationStatus.isKycVerified}
        kycStatus={vendorProfile?.kyc_status || 'pending'}
        storeName={vendorProfile?.store_name || 'Store Name'}
        onKycPress={() => router.push('/vendor/profile/documents')}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Restaurant Earnings</Text>
          <Text className="text-sm text-gray-600 mt-1">Track your revenue and manage payouts</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Wallet Overview Cards */}
        <View className="px-4 pt-4 pb-2 gap-3">
          {/* Available Balance - Primary Card */}
          <LinearGradient
            colors={['#10b981', '#0d9488']}
            style={{ borderRadius: 16 }}
            className="rounded-2xl p-6 shadow-lg"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-white text-sm opacity-90 font-medium mb-1">
                  Available Balance
                </Text>
                <Text className="text-white text-4xl font-bold">
                  ₹{walletData.available_balance.toLocaleString()}
                </Text>
              </View>
              <View className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Entypo name="wallet" size={24} color="#10b981" />
              </View>
            </View>
            <Text className="text-white text-xs opacity-75 mb-4">
              Ready to withdraw • Tap request cashout below
            </Text>
            <TouchableOpacity
              onPress={() => setCashoutModalVisible(true)}
              className="bg-white rounded-xl px-4 py-3 items-center justify-center"
            >
              <Text className="text-emerald-600 font-bold text-base">Request Cashout</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Secondary Balance Cards Row */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">Pending Balance</Text>
              <Text className="text-orange-600 text-2xl font-bold">
                ₹{walletData.pending_balance.toLocaleString()}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">Awaiting admin approval</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">Lifetime Revenue</Text>
              <Text className="text-emerald-600 text-2xl font-bold">
                ₹{walletData.lifetime_earnings.toLocaleString()}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">Total earned</Text>
            </View>
          </View>
        </View>

        {/* Settlement Status Tracker */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Settlement Status</Text>
            <TouchableOpacity onPress={handleSettlementHistory}>
              <Text className="text-emerald-600 font-semibold text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {recentCashouts.length > 0 ? (
            recentCashouts.map((cashout, idx) => (
              <View key={cashout.id || idx} className="bg-gray-50 rounded-xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-gray-900 font-bold text-base">
                      ₹{cashout.amount.toLocaleString()}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">{cashout.request_number}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(cashout.status).bg}`}>
                      <Text className={`text-xs font-semibold ${getStatusColor(cashout.status).text}`}>
                        {getStatusLabel(cashout.status)}
                      </Text>
                    </View>
                    {cashout.status === 'pending' && (
                      <TouchableOpacity
                        onPress={() => handleCancelCashout(cashout.id)}
                        className="bg-red-50 px-2 py-1 rounded-lg"
                      >
                        <Text className="text-red-600 text-xs font-semibold">Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Timeline */}
                <View className="flex-row justify-between items-start">
                  {[
                    { label: 'Requested', completed: true },
                    {
                      label: 'Approved',
                      completed: ['approved', 'processing', 'transferred', 'completed'].includes(cashout.status),
                    },
                    {
                      label: 'Transferred',
                      completed: ['transferred', 'completed'].includes(cashout.status),
                    },
                    { label: 'Completed', completed: cashout.status === 'completed' },
                  ].map((step, index) => (
                    <View key={index} className="flex-1 items-center">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center mb-2 ${
                          step.completed ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <Feather name={step.completed ? 'check' : 'circle'} size={16} color="#fff" />
                      </View>
                      <Text className="text-xs text-gray-600 text-center">{step.label}</Text>
                    </View>
                  ))}
                </View>

                <Text className="text-xs text-gray-500 mt-3">
                  Requested on{' '}
                  {new Date(cashout.request_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>

                {cashout.status === 'rejected' && cashout.rejection_reason && (
                  <View className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <Text className="text-red-800 text-xs font-semibold mb-1">Rejection Reason:</Text>
                    <Text className="text-red-700 text-xs">{cashout.rejection_reason}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Feather name="inbox" size={32} color="#9ca3af" />
              <Text className="text-gray-600 text-sm mt-2">No cashout requests yet</Text>
            </View>
          )}

          <Text className="text-xs text-gray-600 mt-2">
            Settlement Cycle: T+2 days | Minimum: ₹1,000 | Admin approval required
          </Text>
        </View>

        {/* Earnings Breakdown */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-3">Revenue Breakdown</Text>

          <View className="flex-row gap-2 mb-4">
            {[
              { label: 'Today', value: 'today' },
              { label: 'This Week ', value: 'week' },
              { label: 'This Month', value: 'month' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setActiveEarningsFilter(filter.value as any)}
                className={`px-4 py-2 rounded-lg ${
                  activeEarningsFilter === filter.value
                    ? 'bg-emerald-500'
                    : 'bg-gray-100 border border-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeEarningsFilter === filter.value ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-emerald-50 rounded-xl p-4 items-center">
            <Text className="text-gray-600 text-sm mb-2">{getEarningsLabel()} Revenue</Text>
            <Text className="text-3xl font-bold text-emerald-600">
              ₹{getEarningsAmount().toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Bank Account Section */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-3">Bank Account</Text>

          {bankDetails.data ? (
            <>
              <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-3">
                <View className="flex-row items-start justify-between mb-3">
                  <View>
                    <Text className="text-gray-600 text-xs mb-1">Bank Name</Text>
                    <Text className="text-gray-900 font-bold text-base">{bankDetails.data.bank_name}</Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      bankDetails.data.is_verified
                        ? 'bg-emerald-100'
                        : bankDetails.data.status === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-orange-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        bankDetails.data.is_verified
                          ? 'text-emerald-700'
                          : bankDetails.data.status === 'rejected'
                          ? 'text-red-700'
                          : 'text-orange-700'
                      }`}
                    >
                      {bankDetails.data.is_verified
                        ? 'Verified'
                        : bankDetails.data.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
                    </Text>
                  </View>
                </View>

                <View className="mb-3 pb-3 border-b border-blue-200">
                  <Text className="text-gray-600 text-xs mb-1">Account Holder</Text>
                  <Text className="text-gray-900 font-semibold text-sm mb-3">
                    {bankDetails.data.account_holder_name}
                  </Text>

                  <Text className="text-gray-600 text-xs mb-1">Account Number</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-semibold text-sm">
                      {showBankNumber ? bankDetails.data.account_number : '••••••••'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowBankNumber(!showBankNumber)}>
                      {showBankNumber ? (
                        <Feather name="eye-off" size={16} color="#6b7280" />
                      ) : (
                        <Feather name="eye" size={16} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs mb-1">IFSC Code</Text>
                    <Text className="text-gray-900 font-semibold text-sm">{bankDetails.data.ifsc_code}</Text>
                  </View>
                  {bankDetails.data.account_type && (
                    <View className="flex-1">
                      <Text className="text-gray-600 text-xs mb-1">Account Type</Text>
                      <Text className="text-gray-900 font-semibold text-sm capitalize">
                        {bankDetails.data.account_type}
                      </Text>
                    </View>
                  )}
                </View>

                {bankDetails.data.status === 'rejected' && bankDetails.data.rejection_reason && (
                  <View className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <Text className="text-red-800 text-xs font-semibold mb-1">Rejection Reason:</Text>
                    <Text className="text-red-700 text-xs">{bankDetails.data.rejection_reason}</Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleViewBankAccount}
                  className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-2.5 items-center justify-center"
                >
                  <Text className="text-blue-700 font-semibold text-sm">View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEditBankAccount}
                  className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 items-center justify-center"
                >
                  <Text className="text-emerald-700 font-semibold text-sm">Edit</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Feather name="alert-circle" size={32} color="#f59e0b" />
              <Text className="text-gray-900 font-semibold mt-2">No Bank Account Added</Text>
              <Text className="text-gray-600 text-sm mt-1 text-center">
                Add a bank account to withdraw your earnings
              </Text>
              <TouchableOpacity
                onPress={handleEditBankAccount}
                className="bg-emerald-500 px-6 py-2.5 rounded-xl mt-4"
              >
                <Text className="text-white font-semibold">Add Bank Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Wallet Transaction History */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Transaction History (Recent)</Text>

          {recentTransactions.length > 0 ? (
            recentTransactions.slice(0, 5).map((transaction) => (
              <View
                key={transaction.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-sm">{transaction.description}</Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text
                  className={`text-base font-bold ${
                    transaction.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {transaction.transaction_type === 'credit' ? '+' : '-'}₹
                  {transaction.amount.toLocaleString()}
                </Text>
              </View>
            ))
          ) : (
            <View className="py-6 items-center">
              <Feather name="inbox" size={32} color="#9ca3af" />
              <Text className="text-gray-600 text-sm mt-2">No transactions yet</Text>
            </View>
          )}
        </View>

        {/* Info & Rules */}
        <View className="bg-blue-50 mx-4 my-4 rounded-xl p-4 border border-blue-200">
          <Text className="text-blue-900 font-semibold text-sm mb-2">Settlement Information</Text>
          <Text className="text-blue-800 text-xs leading-5">
            • Settlement cycle: T+2 business days{'\n'}• Minimum cashout: ₹1,000{'\n'}• Admin
            approval required for all withdrawals{'\n'}• Funds transferred to your verified bank
            account
          </Text>
        </View>
      </ScrollView>

      {/* Blur overlay for cashout modal */}
      {(cashoutModalVisible || cancelModal || confirmCashoutModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Cashout Modal */}
      <Modal
        visible={cashoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCashoutModalVisible(false)}
      >
        <View className="flex-1 bg-transparent bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Request Cashout</Text>
              <TouchableOpacity onPress={() => setCashoutModalVisible(false)}>
                <Text className="text-gray-600 text-2xl">×</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-emerald-50 rounded-xl p-3 mb-4 border border-emerald-200">
              <Text className="text-emerald-700 text-xs font-semibold mb-1">Available to Withdraw</Text>
              <Text className="text-emerald-600 text-3xl font-bold">
                ₹{walletData.available_balance.toLocaleString()}
              </Text>
            </View>

            <Text className="text-gray-600 text-sm font-medium mb-2">Enter Amount</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2">
              <Text className="text-2xl text-gray-900 font-bold">₹</Text>
              <TextInput
                placeholder="0"
                value={cashoutAmount}
                onChangeText={setCashoutAmount}
                keyboardType="numeric"
                className="flex-1 ml-2 text-2xl text-gray-900 font-bold"
                placeholderTextColor="#d1d5db"
              />
            </View>

            <Text className="text-gray-500 text-xs mb-6">
              Minimum: ₹1,000 | Maximum: ₹{walletData.available_balance.toLocaleString()}
            </Text>

            {cashoutAmount && parseInt(cashoutAmount) > 0 && (
              <View className="bg-gray-50 rounded-xl p-3 mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600 text-sm">Cashout Amount</Text>
                  <Text className="text-gray-900 font-semibold">
                    ₹{parseInt(cashoutAmount).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 text-sm">Processing Time</Text>
                  <Text className="text-gray-900 font-semibold">2 business days</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleRequestCashout}
              disabled={requestCashout.isPending}
              className={`bg-emerald-500 rounded-xl py-4 items-center justify-center ${
                requestCashout.isPending ? 'opacity-50' : ''
              }`}
            >
              {requestCashout.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Request Cashout</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCashoutModalVisible(false)}
              className="mt-3 py-3 items-center"
            >
              <Text className="text-gray-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Cashout Modal */}
      <Modal
        visible={confirmCashoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmCashoutModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setConfirmCashoutModal(false)}
        >
          <Pressable className="bg-white rounded-3xl p-6 w-full">
            <View className="items-center mb-5">
              <View className="w-16 h-16 bg-emerald-100 rounded-full items-center justify-center mb-3">
                <Entypo name="wallet" size={30} color="#10b981" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Confirm Cashout?</Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                Request cashout of{' '}
                <Text className="font-bold text-gray-800">
                  ₹{pendingCashoutAmount.toLocaleString()}
                </Text>
                ?{'\n\n'}You'll receive this amount within 2 business days after admin approval.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-emerald-500 py-4 rounded-xl items-center justify-center mb-3"
              onPress={handleConfirmCashout}
              disabled={requestCashout.isPending}
            >
              {requestCashout.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Confirm</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="border-2 border-gray-200 py-4 rounded-xl items-center justify-center"
              onPress={() => setConfirmCashoutModal(false)}
              disabled={requestCashout.isPending}
            >
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cancel Cashout Confirmation Modal */}
      <Modal
        visible={cancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCancelModal(false);
          setCashoutIdToCancel(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => {
            setCancelModal(false);
            setCashoutIdToCancel(null);
          }}
        >
          <Pressable className="bg-white rounded-3xl p-6 w-full">
            <View className="items-center mb-5">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                <Feather name="x-circle" size={30} color="#dc2626" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Cancel Cashout Request?</Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                Are you sure you want to cancel this cashout request? The amount will be returned to
                your available balance.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-red-500 py-4 rounded-xl items-center justify-center mb-3"
              onPress={confirmCancelCashout}
              disabled={cancelCashout.isPending}
            >
              {cancelCashout.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Yes, Cancel</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="border-2 border-gray-200 py-4 rounded-xl items-center justify-center"
              onPress={() => {
                setCancelModal(false);
                setCashoutIdToCancel(null);
              }}
              disabled={cancelCashout.isPending}
            >
              <Text className="text-gray-700 font-semibold text-base">No, Keep It</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}