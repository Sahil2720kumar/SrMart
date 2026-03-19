// app/delivery/(tabs)/earnings.tsx
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl,
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
  useDeliveryEarnings,
} from '@/hooks/queries/wallets';
import { useAuthStore } from '@/store/authStore';
import { format, parseISO } from 'date-fns';
import { CancelCashoutModal, SuccessModal, WithdrawalModal } from '@/components/WalletModals';
import { useDeliveryBoyBankDetails } from '@/hooks/queries/useDeliveryBoy';
import Toast from 'react-native-toast-message';

// ─── Earnings Screen ──────────────────────────────────────────────────────────

const EarningsScreen = () => {
  const router      = useRouter();
  const store       = useDeliveryStore();
  const { session } = useAuthStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [refreshing, setRefreshing]         = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showCancelModal, setShowCancelModal]         = useState(false);
  const [showSuccessModal, setShowSuccessModal]       = useState(false);
  const [successAmount, setSuccessAmount]             = useState(0);
  const [selectedCashout, setSelectedCashout]         = useState<{
    id: string; requestNumber: string; amount: string;
  } | null>(null);

  const deliveryBoyId = session?.user?.id;

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } =
    useWallet(deliveryBoyId, 'delivery_boy');

  const bankDetails = useDeliveryBoyBankDetails(deliveryBoyId || '');

  const {
    totalEarnings, orders, distance, baseEarnings,
    transactions: periodTransactions,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useEarningsStats(wallet?.id || '', selectedPeriod);

  const { data: pendingCashouts } = usePendingCashouts(wallet?.id || '');
  const { data: recentCashouts  } = useRecentCashouts(wallet?.id || '', 5);

  // All completed delivery earnings enriched with group info
  const {
    data: allEarnings = [],
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useDeliveryEarnings(deliveryBoyId || '');

  const requestCashoutMutation = useRequestCashout();
  const cancelCashoutMutation  = useCancelCashout();

  const isVerified       = store.adminVerificationStatus === 'approved' && store.isKycCompleted;
  const isLoading        = walletLoading || statsLoading;
  const availableBalance = wallet ? Number(wallet.available_balance) : 0;
  const pendingBalance   = wallet ? Number(wallet.pending_balance)   : 0;
  const canWithdraw      = isVerified && availableBalance > 0;
  const avgPerOrder      = orders > 0 ? (totalEarnings / orders).toFixed(0) : 0;
  const hasEarnings      = orders > 0 || totalEarnings > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchStats(), refetchEarnings()]);
    setRefreshing(false);
  };

  const handleWithdrawClick = () => {
    if (!isVerified) {
      Toast.show({ type: 'error', text1: 'Verification Required', position: 'top' });
      return;
    }
    if (!wallet || availableBalance <= 0) {
      Toast.show({ type: 'info', text1: 'No Balance', position: 'top' });
      return;
    }
    setShowWithdrawalModal(true);
  };

  const handleWithdrawalSubmit = async (amount: number) => {
    try {
      if (!bankDetails.data?.is_verified) {
        Toast.show({
          type:  'error',
          text1: 'Bank Account Required',
          text2: bankDetails.data
            ? 'Your bank account is pending verification.'
            : 'Please add and verify a bank account first.',
          position: 'top',
        });
        return;
      }
      await requestCashoutMutation.mutateAsync({ wallet_id: wallet!.id, amount });
      setShowWithdrawalModal(false);
      setSuccessAmount(amount);
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowWithdrawalModal(false);
      Toast.show({ type: 'error', text1: error.message || 'Failed to process.', position: 'top' });
    }
  };

  const handleCancelClick = (id: string, requestNumber: string, amount: string) => {
    setSelectedCashout({ id, requestNumber, amount });
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedCashout) return;
    try {
      await cancelCashoutMutation.mutateAsync(selectedCashout.id);
      setShowCancelModal(false);
      setSelectedCashout(null);
      Toast.show({ type: 'success', text1: 'Request Cancelled', position: 'top' });
    } catch (error: any) {
      setShowCancelModal(false);
      Toast.show({ type: 'error', text1: error.message || 'Failed to cancel.', position: 'top' });
    }
  };

  const fmt = (d: string | null | undefined) => {
    if (!d) return '—';
    try { return format(parseISO(d.replace(/([+-]\d{2}:\d{2}|Z)$/, '')), 'MMM dd, yyyy'); }
    catch { return d; }
  };
  
  const fmtTime = (d: string | null | undefined) => {
    if (!d) return '';
    try { return format(parseISO(d.replace(/([+-]\d{2}:\d{2}|Z)$/, '')), 'hh:mm a'); }
    catch { return ''; }
  };
  

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      case 'approved':  return { bg: 'bg-green-100',  text: 'text-green-700'  };
      case 'completed': return { bg: 'bg-blue-100',   text: 'text-blue-700'   };
      case 'cancelled': return { bg: 'bg-gray-100',   text: 'text-gray-700'   };
      default:          return { bg: 'bg-gray-100',   text: 'text-gray-700'   };
    }
  };

  const getCodStatusBadge = (codStatus: string | null) => {
    switch (codStatus) {
      case 'pending_deposit':  return { bg: 'bg-amber-100', text: 'text-amber-700',  label: 'Deposit pending' };
      case 'deposit_reported': return { bg: 'bg-blue-100',  text: 'text-blue-700',   label: 'Under review'   };
      case 'deposited':        return { bg: 'bg-green-100', text: 'text-green-700',  label: 'Deposited'      };
      default:                 return null;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return "Today's Earnings";
      case 'week':  return "This Week's Earnings";
      case 'month': return "This Month's Earnings";
    }
  };

  const displayedEarnings = showAllHistory
    ? allEarnings
    : allEarnings.slice(0, 8);

  if (isLoading && !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5]">
        <View className="px-4 py-4">
          <Text className="text-white text-3xl font-bold">Earnings</Text>
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

          {/* Verification warning */}
          {!isVerified && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg border-2 border-orange-400">
              <View className="flex-row items-start">
                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                  <Feather name="alert-triangle" size={24} color="#ea580c" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-2">Verification Required</Text>
                  <Text className="text-sm text-gray-600 leading-5 mb-3">
                    Complete KYC and admin verification to withdraw your earnings.
                  </Text>
                  <TouchableOpacity
                    className="bg-orange-500 py-2 px-4 rounded-lg self-start"
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
                    ₹{pendingBalance.toLocaleString('en-IN')} pending
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
              className={`py-4 rounded-xl flex-row items-center justify-center gap-2 ${
                canWithdraw ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <Feather name="arrow-down-circle" size={20} color="white" />
              <Text className="text-white font-bold text-base">
                {canWithdraw ? 'Withdraw Funds' : 'Withdrawal Unavailable'}
              </Text>
            </TouchableOpacity>

            {isVerified && availableBalance <= 0 && (
              <Text className="text-xs text-gray-500 text-center mt-2">
                No balance available
              </Text>
            )}
          </View>

          {/* Pending Withdrawals */}
          {pendingCashouts && pendingCashouts.length > 0 && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-900 mb-4">Pending Approvals</Text>
              {pendingCashouts.map((cashout) => {
                const sc = getStatusColor(cashout.status);
                return (
                  <View key={cashout.id} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1 gap-2">
                        <Text className="font-bold text-gray-900 text-sm">#{cashout.request_number}</Text>
                        <View className={`px-2 py-0.5 rounded ${sc.bg}`}>
                          <Text className={`text-xs font-bold ${sc.text}`}>
                            {cashout.status.charAt(0).toUpperCase() + cashout.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500">
                        {fmt(cashout.request_date || cashout.created_at)}
                      </Text>
                      {cashout.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleCancelClick(cashout.id, cashout.request_number, cashout.amount)}
                          className="mt-1"
                        >
                          <Text className="text-xs text-red-600 font-semibold">Cancel Request</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text className="text-lg font-bold text-gray-900">
                      ₹{Number(cashout.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Lifetime Summary */}
          {wallet && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-900 mb-4">Lifetime Summary</Text>
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-indigo-50 rounded-2xl p-4">
                  <Feather name="trending-up" size={20} color="#4f46e5" />
                  <Text className="text-xs text-gray-500 mt-2 mb-1">Total Earned</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    ₹{Number(wallet.lifetime_earnings).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View className="flex-1 bg-green-50 rounded-2xl p-4">
                  <Feather name="arrow-down" size={20} color="#22c55e" />
                  <Text className="text-xs text-gray-500 mt-2 mb-1">Withdrawn</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    ₹{Number(wallet.total_withdrawn).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
              {recentCashouts && recentCashouts[0]?.status === 'completed' && (
                <View className="bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-xs text-gray-500 mb-1">Last Withdrawal</Text>
                      <Text className="text-sm font-semibold text-gray-900">
                        ₹{Number(recentCashouts[0].amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {fmt(recentCashouts[0].completed_at || recentCashouts[0].created_at)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Period tabs */}
          <View className="flex-row gap-2 mb-4">
            {(['today', 'week', 'month'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPeriod(p)}
                className={`flex-1 py-3 rounded-full ${
                  selectedPeriod === p ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <Text className={`text-center font-bold ${
                  selectedPeriod === p ? 'text-[#4f46e5]' : 'text-white'
                }`}>
                  {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {statsLoading ? (
            <View className="bg-white rounded-3xl p-8 items-center shadow-lg">
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text className="text-gray-500 mt-4">Loading earnings...</Text>
            </View>
          ) : hasEarnings ? (
            <>
              {/* Period Summary */}
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

              {/* Period transaction list */}
              {periodTransactions.length > 0 && (
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                  <Text className="text-lg font-bold text-gray-900 mb-4">
                    {getPeriodLabel()} — Details
                  </Text>
                  {periodTransactions.slice(0, 6).map((tx) => {
                    const meta        = tx.metadata as any;
                    const orderNumber = meta?.order_number || tx.order_id?.substring(0, 8);
                    return (
                      <View key={tx.id} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                        <View className="flex-1">
                          <Text className="font-bold text-gray-900 text-sm">#{orderNumber}</Text>
                          <Text className="text-xs text-gray-500 mt-0.5">
                            {fmt(tx.created_at)}  {fmtTime(tx.created_at)}
                          </Text>
                        </View>
                        <Text className="text-base font-bold text-green-600">
                          +₹{Number(tx.amount).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {orders > 0 && (
                <LinearGradient
                  colors={['#22c55e', '#059669']}
                  className="rounded-3xl p-5 shadow-lg mb-4"
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
                      ? `You've earned ₹${avgPerOrder} per order on average today.`
                      : `You're averaging ₹${avgPerOrder} per order this ${selectedPeriod}.`}
                  </Text>
                </LinearGradient>
              )}
            </>
          ) : (
            <View className="bg-white rounded-3xl p-8 items-center shadow-lg mb-4">
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Feather name="dollar-sign" size={48} color="#9ca3af" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                No Earnings {selectedPeriod === 'today' ? 'Today' : `This ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`}
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                {wallet && Number(wallet.lifetime_earnings) > 0
                  ? 'No deliveries completed during this period'
                  : 'Complete your first order to start earning'}
              </Text>
              <TouchableOpacity
                className="bg-[#4f46e5] px-6 py-3 rounded-full"
                onPress={() => router.push('/delivery/orders')}
              >
                <Text className="text-white font-bold">Browse Orders</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── All Delivery History ── */}
          <Text className="text-xl font-bold text-white mb-3">Delivery History</Text>

          {earningsLoading ? (
            <View className="bg-white rounded-3xl p-6 items-center shadow-lg mb-4">
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text className="text-gray-500 mt-3">Loading history...</Text>
            </View>
          ) : allEarnings.length === 0 ? (
            <View className="bg-white rounded-3xl p-6 items-center shadow-lg mb-4">
              <Text className="text-gray-500">No completed deliveries yet</Text>
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-5 shadow-lg mb-4">
              {displayedEarnings.map((entry, idx) => {
                const codBadge = getCodStatusBadge(entry.cod_status);
                const isCod    = entry.payment_method === 'cod';

                return (
                  <View
                    key={entry.earning_id}
                    className={`py-4 ${
                      idx < displayedEarnings.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">

                        {/* Order number + payment method */}
                        <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                          <Text className="font-bold text-gray-900 text-sm">
                            #{entry.order_number ?? entry.order_id.substring(0, 8)}
                          </Text>
                          {isCod && (
                            <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                              <Text className="text-amber-700 text-xs font-bold">COD</Text>
                            </View>
                          )}
                          {codBadge && (
                            <View className={`px-2 py-0.5 rounded-full ${codBadge.bg}`}>
                              <Text className={`text-xs font-bold ${codBadge.text}`}>
                                {codBadge.label}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Vendor names */}
                        <Text className="text-xs text-gray-600 mb-1" numberOfLines={1}>
                          {entry.vendor_names}
                        </Text>

                        {/* Customer name */}
                        {entry.customer_name ? (
                          <Text className="text-xs text-gray-500 mb-1">
                            To: {entry.customer_name}
                          </Text>
                        ) : null}

                        {/* Group ID */}
                        {entry.order_group_id && (
                          <Text className="text-xs text-indigo-400 font-mono" numberOfLines={1}>
                            Group: {entry.order_group_id.substring(0, 18)}...
                          </Text>
                        )}

                        {/* Date + time */}
                        <Text className="text-xs text-gray-400 mt-1">
                          {fmt(entry.earned_at)}  {fmtTime(entry.earned_at)}
                        </Text>
                      </View>

                      {/* Amount */}
                      <View className="items-end">
                        <Text className="text-base font-bold text-green-600">
                          +₹{entry.total_earnings.toLocaleString('en-IN')}
                        </Text>
                        {entry.order_count > 1 && (
                          <Text className="text-xs text-gray-400 mt-0.5">
                            {entry.order_count} orders
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Show more / less */}
              {allEarnings.length > 8 && (
                <TouchableOpacity
                  onPress={() => setShowAllHistory(!showAllHistory)}
                  className="mt-3 py-3 bg-gray-50 rounded-xl items-center"
                >
                  <Text className="text-indigo-600 font-bold text-sm">
                    {showAllHistory
                      ? 'Show Less'
                      : `Show All ${allEarnings.length} Deliveries`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      <WithdrawalModal
        visible={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        availableBalance={availableBalance}
        onSubmit={handleWithdrawalSubmit}
        isLoading={requestCashoutMutation.isPending}
      />

      <CancelCashoutModal
        visible={showCancelModal}
        onClose={() => { setShowCancelModal(false); setSelectedCashout(null); }}
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

export default EarningsScreen;