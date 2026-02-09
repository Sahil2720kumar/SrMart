import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useWallet,
  useEarningsStats,
  usePendingCashouts,
  useRequestCashout,
  useCancelCashout,
  useRecentCashouts,
} from '@/hooks/queries/wallets';
import { useAuthStore } from '@/store/authStore';
import { format, parseISO } from 'date-fns';
import { CancelCashoutModal, SuccessModal, WithdrawalModal } from '@/components/WalletModals';
import { useDeliveryBoyBankDetails } from '@/hooks/queries/useDeliveryBoy';



/* ---------------- MAIN COMPONENT ---------------- */
const EarningsScreen = () => {
  const router = useRouter();
  const store = useDeliveryStore();
  const { session } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [selectedCashout, setSelectedCashout] = useState<{
    id: string;
    requestNumber: string;
    amount: string;
  } | null>(null);

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet(
    session?.user?.id,
    'delivery_boy'
  );
  const bankDetails = useDeliveryBoyBankDetails(session?.user?.id || '');
  // Fetch earnings stats for selected period
  const {
    totalEarnings,
    orders,
    distance,
    baseEarnings,
    transactions: periodTransactions,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useEarningsStats(wallet?.id || '', selectedPeriod);

  // Fetch pending cashouts
  const { data: pendingCashouts, isLoading: cashoutsLoading } = usePendingCashouts(wallet?.id || '');

  // Fetch recent cashouts for history
  const { data: recentCashouts } = useRecentCashouts(wallet?.id || '', 5);

  // Mutations
  const requestCashoutMutation = useRequestCashout();
  const cancelCashoutMutation = useCancelCashout();

  const isVerified = store.adminVerificationStatus === 'approved' && store.isKycCompleted;
  const isLoading = walletLoading || statsLoading;

  const avgPerOrder = orders > 0 ? (totalEarnings / orders).toFixed(0) : 0;
  const hasEarnings = orders > 0 || totalEarnings > 0;
  const availableBalance = wallet ? parseFloat(wallet.available_balance) : 0;
  const pendingBalance = wallet ? parseFloat(wallet.pending_balance) : 0;
  const canWithdraw = isVerified && availableBalance > 0;

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return "Today's Earnings";
      case 'week': return "This Week's Earnings";
      case 'month': return "This Month's Earnings";
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchStats()]);
    setRefreshing(false);
  };

  const handleWithdrawClick = () => {
    if (!isVerified) {
      Alert.alert(
        'Verification Required',
        'Please complete KYC and admin verification to withdraw funds.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!wallet || availableBalance <= 0) {
      Alert.alert('No Balance', 'You have no available balance to withdraw.', [{ text: 'OK' }]);
      return;
    }

    setShowWithdrawalModal(true);
  };

  const handleWithdrawalSubmit = async (amount: number) => {
    try {

      if (!bankDetails.data?.is_verified) {
        Alert.alert(
          'Bank Account Required',
          bankDetails.data
            ? 'Your bank account is pending verification. Please wait for admin approval.'
            : 'Please add and verify a bank account first.'
        );
        return;
      }

      await requestCashoutMutation.mutateAsync({
        wallet_id: wallet!.id,
        amount: amount,
      });

      setShowWithdrawalModal(false);
      setSuccessAmount(amount);
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowWithdrawalModal(false);
      Alert.alert(
        'Error',
        error.message || 'Failed to process withdrawal request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelClick = (cashoutId: string, requestNumber: string, amount: string) => {
    setSelectedCashout({ id: cashoutId, requestNumber, amount });
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedCashout) return;

    try {
      await cancelCashoutMutation.mutateAsync(selectedCashout.id);
      setShowCancelModal(false);
      setSelectedCashout(null);
      Alert.alert('Success', 'Withdrawal request cancelled successfully. Funds have been returned to your available balance.');
    } catch (error: any) {
      setShowCancelModal(false);
      Alert.alert('Error', error.message || 'Failed to cancel withdrawal request.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Remove timezone offset (+00:00, +05:30, -08:00, etc.) and Z
      const localDateString = dateString.replace(/([+-]\d{2}:\d{2}|Z)$/, '');      
      return format(parseISO(localDateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };
  
  const formatTime = (dateString: string) => {
    try {
      // Remove timezone offset (+00:00, +05:30, -08:00, etc.) and Z
      const localDateString = dateString.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
      return format(parseISO(localDateString), 'hh:mm a');
    } catch {
      return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      case 'approved': return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'completed': return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'cancelled': return { bg: 'bg-gray-100', text: 'text-gray-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading && !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5]">
        <View className="px-4 py-4">
          <Text className="text-white text-3xl font-bold">Earnings</Text>
          <Text className="text-indigo-100 text-sm mt-1">Track your income and performance</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white mt-4">Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="px-4 py-4">
        <Text className="text-white text-3xl font-bold">Earnings</Text>
        <Text className="text-indigo-100 text-sm mt-1">Track your income and performance</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
            colors={['#4f46e5']}
          />
        }
      >
        <View className="px-4">
          {/* Verification Warning */}
          {!isVerified && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg border-2 border-orange-400">
              <View className="flex-row items-start">
                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                  <Feather name="alert-triangle" size={24} color="#ea580c" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-2">
                    Verification Required
                  </Text>
                  <Text className="text-sm text-gray-600 leading-5 mb-3">
                    Complete KYC and admin verification to withdraw your earnings.
                  </Text>
                  <TouchableOpacity
                    className="bg-orange-500 py-2 px-4 rounded-lg self-start"
                    activeOpacity={0.8}
                    onPress={() => router.push('/delivery/profile')}
                  >
                    <Text className="text-white font-bold text-sm">Complete Verification</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Available Balance Card */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-sm text-gray-500 mb-1">Available Balance</Text>
                <Text className="text-4xl font-bold text-gray-900">
                  ₹{availableBalance.toLocaleString('en-IN')}
                </Text>
                {pendingBalance > 0 && (
                  <Text className="text-xs text-amber-600 mt-1">
                    ₹{pendingBalance.toLocaleString('en-IN')} pending withdrawal
                  </Text>
                )}
              </View>
              <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center">
                <Feather name="dollar-sign" size={28} color="#22c55e" />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleWithdrawClick}
              disabled={!canWithdraw}
              className={`py-4 rounded-xl flex-row items-center justify-center gap-2 ${canWithdraw ? 'bg-green-500' : 'bg-gray-300'
                }`}
              activeOpacity={0.8}
            >
              <Feather name="arrow-down-circle" size={20} color="white" />
              <Text className="text-white font-bold text-base">
                {canWithdraw ? 'Withdraw Funds' : 'Withdrawal Unavailable'}
              </Text>
            </TouchableOpacity>

            {!isVerified && (
              <Text className="text-xs text-orange-600 text-center mt-2">
                Complete verification to enable withdrawals
              </Text>
            )}
            {isVerified && availableBalance <= 0 && (
              <Text className="text-xs text-gray-500 text-center mt-2">
                No balance available for withdrawal
              </Text>
            )}
          </View>

          {/* Pending Withdrawals Section */}
          {pendingCashouts && pendingCashouts.length > 0 && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-900 mb-4">Pending Approvals</Text>

              {pendingCashouts.map((cashout) => {
                const statusColors = getStatusColor(cashout.status);
                return (
                  <View
                    key={cashout.id}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className="font-bold text-gray-900 text-sm mr-2">
                          #{cashout.request_number}
                        </Text>
                        <View className={`px-2 py-0.5 rounded ${statusColors.bg}`}>
                          <Text className={`text-xs font-bold ${statusColors.text}`}>
                            {getStatusLabel(cashout.status)}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500">
                        {formatDate(cashout.request_date || cashout.created_at)}
                      </Text>
                      {cashout.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleCancelClick(cashout.id, cashout.request_number, cashout.amount)}
                          className="mt-2"
                        >
                          <Text className="text-xs text-red-600 font-semibold">
                            Cancel Request
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text className="text-lg font-bold text-gray-900">
                      ₹{parseFloat(cashout.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Lifetime Stats */}
          {wallet && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-900 mb-4">Lifetime Summary</Text>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-indigo-50 rounded-2xl p-4">
                  <Feather name="trending-up" size={20} color="#4f46e5" />
                  <Text className="text-xs text-gray-500 mt-2 mb-1">Total Earned</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    ₹{parseFloat(wallet.lifetime_earnings).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View className="flex-1 bg-green-50 rounded-2xl p-4">
                  <Feather name="arrow-down" size={20} color="#22c55e" />
                  <Text className="text-xs text-gray-500 mt-2 mb-1">Withdrawn</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    ₹{parseFloat(wallet.total_withdrawn).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {recentCashouts && recentCashouts.length > 0 && recentCashouts[0].status === 'completed' && (
                <View className="bg-gray-50 rounded-xl p-3 mt-2">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-xs text-gray-500 mb-1">Last Withdrawal</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        ₹{parseFloat(recentCashouts[0].amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {formatDate(recentCashouts[0].completed_at || recentCashouts[0].created_at)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Time Filter Tabs */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedPeriod('today')}
              className={`flex-1 py-3 rounded-full ${selectedPeriod === 'today' ? 'bg-white' : 'bg-white/20'
                }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-bold ${selectedPeriod === 'today' ? 'text-[#4f46e5]' : 'text-white'
                }`}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedPeriod('week')}
              className={`flex-1 py-3 rounded-full ${selectedPeriod === 'week' ? 'bg-white' : 'bg-white/20'
                }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-bold ${selectedPeriod === 'week' ? 'text-[#4f46e5]' : 'text-white'
                }`}>
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedPeriod('month')}
              className={`flex-1 py-3 rounded-full ${selectedPeriod === 'month' ? 'bg-white' : 'bg-white/20'
                }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-bold ${selectedPeriod === 'month' ? 'text-[#4f46e5]' : 'text-white'
                }`}>
                This Month
              </Text>
            </TouchableOpacity>
          </View>

          {statsLoading ? (
            <View className="bg-white rounded-3xl p-8 items-center shadow-lg">
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text className="text-gray-500 mt-4">Loading earnings...</Text>
            </View>
          ) : hasEarnings ? (
            <>
              {/* Period Summary Card */}
              <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
                <Text className="text-sm text-gray-500 mb-2">{getPeriodLabel()}</Text>
                <Text className="text-4xl font-bold text-gray-900 mb-5">
                  ₹{totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-indigo-50 rounded-xl p-3">
                    <View className="w-8 h-8 bg-indigo-500 rounded-full items-center justify-center mb-2">
                      <Feather name="package" size={16} color="white" />
                    </View>
                    <Text className="text-xs text-gray-500 mb-0.5">Orders</Text>
                    <Text className="text-xl font-bold text-gray-900">{orders}</Text>
                  </View>

                  <View className="flex-1 bg-blue-50 rounded-xl p-3">
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mb-2">
                      <Feather name="navigation" size={16} color="white" />
                    </View>
                    <Text className="text-xs text-gray-500 mb-0.5">Distance</Text>
                    <Text className="text-xl font-bold text-gray-900">
                      {distance.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km
                    </Text>
                  </View>

                  <View className="flex-1 bg-green-50 rounded-xl p-3">
                    <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mb-2">
                      <Feather name="trending-up" size={16} color="white" />
                    </View>
                    <Text className="text-xs text-gray-500 mb-0.5">Avg</Text>
                    <Text className="text-xl font-bold text-gray-900">₹{avgPerOrder}</Text>
                  </View>
                </View>
              </View>

              {/* Earnings Breakdown */}
              {baseEarnings > 0 && (
                <View className="mb-4">
                  <Text className="text-lg font-bold text-white mb-3">Earnings Breakdown</Text>
                  <View className="flex-row gap-3">
                    <BreakdownCard
                      icon="dollar-sign"
                      label="Base Earnings"
                      amount={baseEarnings}
                      color="bg-indigo-500"
                    />
                    <BreakdownCard
                      icon="award"
                      label="Other"
                      amount={totalEarnings - baseEarnings}
                      color="bg-orange-500"
                    />
                  </View>
                </View>
              )}

              {/* Order Earnings List */}
              {periodTransactions && periodTransactions.length > 0 && (
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Earning History</Text>

                  {periodTransactions.slice(0, 8).map((transaction) => {
                    const metadata = transaction.metadata as any;
                    const distanceKm = metadata?.distance_km ? parseFloat(metadata.distance_km) : 0;
                    const orderNumber = metadata?.order_number || transaction.order_id?.substring(0, 8);

                    return (
                      <View
                        key={transaction.id}
                        className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                      >
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Text className="font-bold text-gray-900 text-sm mr-2">
                              #{orderNumber}
                            </Text>
                            <View className="bg-green-100 px-2 py-0.5 rounded">
                              <Text className="text-xs font-bold text-green-700">Completed</Text>
                            </View>
                          </View>
                          <View className="flex-row items-center">
                            <Text className="text-xs text-gray-500 mr-2">
                              {formatDate(transaction.created_at)}  {formatTime(transaction.created_at)}
                            </Text>
                            {distanceKm > 0 && (
                              <View className="flex-row items-center">
                                <Feather name="navigation" size={10} color="#9ca3af" />
                                <Text className="text-xs text-gray-500 ml-1">
                                   {distanceKm.toFixed(1)} km
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text className="text-lg font-bold text-green-600">
                          ₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    );
                  })}

                  {/* {periodTransactions.length > 8 && (
                    <TouchableOpacity
                      className="mt-3 py-2 items-center"
                      activeOpacity={0.8}
                      onPress={() => router.push('/delivery/earnings/history')}
                    >
                      <Text className="text-indigo-600 font-semibold text-sm">
                        View All {periodTransactions.length} Transactions
                      </Text>
                    </TouchableOpacity>
                  )} */}
                </View>
              )}

              {/* Motivational Card */}
              {orders > 0 && (
                <LinearGradient
                  colors={['#22c55e', '#059669']}
                  className="rounded-3xl p-5 shadow-lg"
                  style={{ borderRadius: 16 }}
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-3">
                      <Feather name="zap" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">Great Work!</Text>
                      <Text className="text-white/80 text-xs">Keep up the momentum</Text>
                    </View>
                  </View>
                  <Text className="text-white text-sm leading-5">
                    {selectedPeriod === 'today'
                      ? `You've earned ₹${avgPerOrder} per order on average today. Keep delivering!`
                      : `You're averaging ₹${avgPerOrder} per order this ${selectedPeriod}. Excellent performance!`
                    }
                  </Text>
                </LinearGradient>
              )}
            </>
          ) : (
            /* Empty State */
            <View className="bg-white rounded-3xl p-8 items-center shadow-lg">
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Feather name="dollar-sign" size={48} color="#9ca3af" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                No Earnings {selectedPeriod === 'today' ? 'Today' : `This ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`}
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                {wallet && parseFloat(wallet.lifetime_earnings) > 0
                  ? 'No deliveries completed during this period'
                  : 'Complete your first order to start earning'
                }
              </Text>
              <TouchableOpacity
                className="bg-[#4f46e5] px-6 py-3 rounded-full"
                activeOpacity={0.8}
                onPress={() => router.push('/delivery/orders')}
              >
                <Text className="text-white font-bold">Browse Orders</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <WithdrawalModal
        visible={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableBalance={availableBalance}
        onSubmit={handleWithdrawalSubmit}
        isLoading={requestCashoutMutation.isPending}
      />

      <CancelCashoutModal
        visible={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedCashout(null);
        }}
        onConfirm={handleCancelConfirm}
        requestNumber={selectedCashout?.requestNumber || ''}
        amount={selectedCashout?.amount || '0'}
        isLoading={cancelCashoutMutation.isPending}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        amount={successAmount}
      />
    </SafeAreaView>
  );
};

/* ---------------- BREAKDOWN CARD COMPONENT ---------------- */
const BreakdownCard = ({
  icon,
  label,
  amount,
  color
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  amount: number;
  color: string;
}) => (
  <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
    <View className={`w-10 h-10 ${color} rounded-xl items-center justify-center mb-3`}>
      <Feather name={icon} size={20} color="white" />
    </View>
    <Text className="text-xs text-gray-500 mb-1 font-semibold">{label}</Text>
    <Text className="text-xl font-bold text-gray-900">
      ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
    </Text>
  </View>
);

export default EarningsScreen;