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
  useAllCreditTransactions,
} from '@/hooks/queries/wallets';
import { useVendorProfile } from '@/hooks/queries';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import VerificationGate from '@/components/vendorVerificationComp';
import { format, parseISO } from 'date-fns';

// ─── Period helper ────────────────────────────────────────────────────────────

function getPeriodStart(period: 'today' | 'week' | 'month'): Date {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    case 'week':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
}

function safeDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return format(
      parseISO(d.replace(/([+-]\d{2}:\d{2}|Z)$/, '')),
      'MMM dd, yyyy'
    );
  } catch {
    return d;
  }
}

function safeDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return format(
      parseISO(d.replace(/([+-]\d{2}:\d{2}|Z)$/, '')),
      'MMM dd, hh:mm a'
    );
  } catch {
    return d;
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VendorEarningsScreen() {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  const { data: vendorProfile } = useVendorProfile(userId);
  const vendorId = vendorProfile?.user_id;

  const { wallet, transactions, cashouts, bankDetails, isLoading } =
    useWalletData(userId, 'vendor', vendorId);

  const requestCashout = useRequestCashout();
  const cancelCashout = useCancelCashout();

  // All credit transactions — period filtered client-side
  const allCreditTx = useAllCreditTransactions(wallet.data?.id ?? '');

  const [cashoutModalVisible, setCashoutModalVisible] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month'>('today');
  const [showBankNumber, setShowBankNumber] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cashoutIdToCancel, setCashoutIdToCancel] = useState<string | null>(null);
  const [confirmCashoutModal, setConfirmCashoutModal] = useState(false);
  const [pendingCashoutAmount, setPendingCashoutAmount] = useState(0);

  const verificationStatus = useMemo(() => {
    if (!vendorProfile) return { isAdminVerified: false, isKycVerified: false };
    return {
      isAdminVerified: vendorProfile.is_verified,
      isKycVerified: vendorProfile.kyc_status === 'approved',
    };
  }, [vendorProfile]);

  // ── Client-side period earnings ───────────────────────────────────────────

  const periodStats = useMemo(() => {
    const allTx = allCreditTx.data ?? [];
    const startMs = getPeriodStart(activeFilter).getTime();

    const filtered = allTx.filter((tx) => {
      if (!tx.created_at) return false;
      const raw = tx.created_at.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
      return new Date(raw).getTime() >= startMs;
    });

    const total = filtered.reduce((s, tx) => s + Number(tx.amount), 0);
    const orders = filtered.length;
    return { total, orders, filtered };
  }, [allCreditTx.data, activeFilter]);

  const filterLabel = activeFilter === 'today' ? 'Today'
    : activeFilter === 'week' ? 'This Week'
      : 'This Month';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      wallet.refetch(),
      transactions.refetch(),
      cashouts.refetch(),
      bankDetails.refetch(),
      allCreditTx.refetch(),
    ]);
    setRefreshing(false);
  };

  const handleRequestCashout = () => {
    const amount = parseInt(cashoutAmount);
    if (!cashoutAmount || amount === 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid amount', position: 'top' });
      return;
    }
    if (amount > Number(wallet.data?.available_balance ?? 0)) {
      Toast.show({ type: 'error', text1: 'Amount exceeds available balance', position: 'top' });
      return;
    }
    if (amount < 1000) {
      Toast.show({ type: 'error', text1: 'Minimum cashout amount is ₹1,000', position: 'top' });
      return;
    }
    if (!bankDetails.data?.is_verified) {
      Toast.show({
        type: 'error',
        text1: 'Bank Account Required',
        text2: bankDetails.data
          ? 'Your bank account is pending verification.'
          : 'Please add and verify a bank account first.',
        position: 'top',
      });
      return;
    }
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
        text1: 'Cashout requested!',
        text2: `₹${pendingCashoutAmount.toLocaleString()} will be transferred within 2 business days.`,
        position: 'top',
      });
    } catch (error: any) {
      setConfirmCashoutModal(false);
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to process cashout request.',
        position: 'top',
      });
    }
  };

  const handleCancelCashout = (id: string) => {
    setCashoutIdToCancel(id);
    setCancelModal(true);
  };

  const confirmCancelCashout = async () => {
    if (!cashoutIdToCancel) return;
    try {
      await cancelCashout.mutateAsync(cashoutIdToCancel);
      setCancelModal(false);
      setCashoutIdToCancel(null);
      Toast.show({ type: 'success', text1: 'Cashout cancelled successfully.', position: 'top' });
    } catch (error: any) {
      setCancelModal(false);
      setCashoutIdToCancel(null);
      Toast.show({ type: 'error', text1: error.message || 'Failed to cancel.', position: 'top' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case 'approved':
      case 'processing':
      case 'transferred': return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'pending': return { bg: 'bg-orange-100', text: 'text-orange-700' };
      case 'rejected': return { bg: 'bg-red-100', text: 'text-red-700' };
      case 'cancelled': return { bg: 'bg-gray-100', text: 'text-gray-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────

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

  // Safe Number() conversions — Supabase returns numeric fields as strings
  const availableBalance = Number(wallet.data.available_balance ?? 0);
  const pendingBalance = Number(wallet.data.pending_balance ?? 0);
  const lifetimeEarnings = Number(wallet.data.lifetime_earnings ?? 0);
  const totalWithdrawn = Number(wallet.data.total_withdrawn ?? 0);

  const recentCashouts = cashouts.data || [];
  const recentTransactions = transactions.data || [];
  const allTxHistory = allCreditTx.data || [];
  const displayedHistory = showAllHistory ? allTxHistory : allTxHistory.slice(0, 8);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">

      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Vendor Earnings</Text>
        <Text className="text-sm text-gray-600 mt-1">Track your revenue and manage payouts</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >

        {/* ── Balance Cards ── */}
        <View className="px-4 pt-4 pb-2 gap-3">
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
                  ₹{availableBalance.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="bg-white/20 p-3 rounded-xl">
                <Entypo name="wallet" size={24} color="#10b981" />
              </View>
            </View>
            <Text className="text-white text-xs opacity-75 mb-4">
              Ready to withdraw · Tap request cashout below
            </Text>
            <TouchableOpacity
              onPress={() => setCashoutModalVisible(true)}
              className="bg-white rounded-xl px-4 py-3 items-center justify-center"
            >
              <Text className="text-emerald-600 font-bold text-base">Request Cashout</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">Pending Balance</Text>
              <Text className="text-orange-600 text-2xl font-bold">
                ₹{pendingBalance.toLocaleString('en-IN')}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">Awaiting release</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">Lifetime Revenue</Text>
              <Text className="text-emerald-600 text-2xl font-bold">
                ₹{lifetimeEarnings.toLocaleString('en-IN')}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">Total earned</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">Total Withdrawn</Text>
              <Text className="text-blue-600 text-2xl font-bold">
                ₹{totalWithdrawn.toLocaleString('en-IN')}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">All time withdrawals</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">{filterLabel} Revenue</Text>
              <Text className="text-emerald-600 text-2xl font-bold">
                ₹{periodStats.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
              <Text className="text-gray-500 text-xs mt-2">{periodStats.orders} orders</Text>
            </View>
          </View>
        </View>

        {/* ── Settlement Status ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Settlement Status</Text>

          {recentCashouts.length > 0 ? (
            recentCashouts.map((cashout, idx) => (
              <View key={cashout.id || idx} className="bg-gray-50 rounded-xl p-4 mb-3">
                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-gray-900 font-bold text-base">
                      ₹{Number(cashout.amount).toLocaleString('en-IN')}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">{cashout.request_number}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(cashout.status).bg}`}>
                      <Text className={`text-xs font-semibold ${getStatusColor(cashout.status).text}`}>
                        {cashout.status.charAt(0).toUpperCase() + cashout.status.slice(1)}
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

                {/* Progress steps */}
                <View className="flex-row justify-between items-start">
                  {[
                    { label: 'Requested', done: true },
                    { label: 'Approved', done: ['approved', 'processing', 'transferred', 'completed'].includes(cashout.status) },
                    { label: 'Transferred', done: ['transferred', 'completed'].includes(cashout.status) },
                    { label: 'Completed', done: cashout.status === 'completed' },
                  ].map((step, i) => (
                    <View key={i} className="flex-1 items-center">
                      <View className={`w-8 h-8 rounded-full items-center justify-center mb-2 ${step.done ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}>
                        <Feather name={step.done ? 'check' : 'circle'} size={16} color="#fff" />
                      </View>
                      <Text className="text-xs text-gray-600 text-center">{step.label}</Text>
                    </View>
                  ))}
                </View>

                <Text className="text-xs text-gray-500 mt-3">
                  Requested on {safeDate(cashout.request_date || cashout.created_at)}
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
            Settlement Cycle: T+2 days · Minimum: ₹1,000 · Admin approval required
          </Text>
        </View>

        {/* ── Revenue Breakdown (client-side) ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-3">Revenue Breakdown</Text>

          <View className="flex-row gap-2 mb-4">
            {(['today', 'week', 'month'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-lg ${activeFilter === f ? 'bg-emerald-500' : 'bg-gray-100 border border-gray-200'
                  }`}
              >
                <Text className={`text-sm font-semibold ${activeFilter === f ? 'text-white' : 'text-gray-700'
                  }`}>
                  {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {allCreditTx.isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#10b981" />
            </View>
          ) : (
            <>
              <View className="bg-emerald-50 rounded-xl p-4 items-center mb-4">
                <Text className="text-gray-600 text-sm mb-1">{filterLabel} Revenue</Text>
                <Text className="text-3xl font-bold text-emerald-600">
                  ₹{periodStats.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {periodStats.orders} order{periodStats.orders !== 1 ? 's' : ''}
                </Text>
              </View>

              {periodStats.filtered.length > 0 && (
                <View>
                  <Text className="text-sm font-bold text-gray-700 mb-2">
                    {filterLabel} — Details
                  </Text>
                  {periodStats.filtered.slice(0, 5).map((tx) => {
                    const meta = tx.metadata as any;
                    const orderNum = meta?.order_number || tx.order_id?.substring(0, 8) || '—';
                    return (
                      <View key={tx.id} className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold text-sm">#{orderNum}</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">
                            {safeDateTime(tx.created_at)}
                          </Text>
                        </View>
                        <Text className="text-base font-bold text-emerald-600">
                          +₹{Number(tx.amount).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {periodStats.filtered.length === 0 && (
                <View className="items-center py-4">
                  <Text className="text-gray-500 text-sm">
                    No earnings {filterLabel.toLowerCase()}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* ── All Earnings History ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">All Earnings History</Text>
            <Text className="text-xs text-gray-400">{allTxHistory.length} transactions</Text>
          </View>

          {allCreditTx.isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#10b981" />
            </View>
          ) : allTxHistory.length === 0 ? (
            <View className="py-6 items-center">
              <Feather name="inbox" size={32} color="#9ca3af" />
              <Text className="text-gray-600 text-sm mt-2">No earnings yet</Text>
            </View>
          ) : (
            <>
              {displayedHistory.map((tx) => {
                const meta = tx.metadata as any;
                const orderNum = String(meta?.order_number || tx.order_id?.substring(0, 8) || '—');
                const desc = String(tx.description || '');
                const subtotal = meta?.subtotal ? Number(meta.subtotal) : null;
                const commission = meta?.commission ? Number(meta.commission) : null;
                const isPending = meta?.status === 'pending';

                return (
                  <View key={tx.id} className="py-3 border-b border-gray-100">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-gray-900 font-bold text-sm mb-0.5">
                          {'#' + orderNum}
                        </Text>
                        <Text className="text-gray-500 text-xs mb-0.5" numberOfLines={1}>
                          {desc}
                        </Text>
                        {subtotal !== null && (
                          <View className="flex-row mt-0.5">
                            <Text className="text-xs text-gray-400">
                              {'Subtotal: ₹' + subtotal.toLocaleString('en-IN')}
                            </Text>
                            {commission !== null && (
                              <Text className="text-xs text-red-400 ml-3">
                                {'Commission: -₹' + commission.toLocaleString('en-IN')}
                              </Text>
                            )}
                          </View>
                        )}
                        <Text className="text-gray-400 text-xs mt-1">
                          {safeDateTime(tx.created_at)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-base font-bold text-emerald-600">
                          {'+₹' + Number(tx.amount).toLocaleString('en-IN')}
                        </Text>
                        <View className={`mt-1 px-2 py-0.5 rounded-full ${isPending ? 'bg-orange-100' : 'bg-emerald-100'
                          }`}>
                          <Text className={`text-xs font-semibold ${isPending ? 'text-orange-700' : 'text-emerald-700'
                            }`}>
                            {isPending ? 'Pending' : 'Credited'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}

              {allTxHistory.length > 8 && (
                <TouchableOpacity
                  onPress={() => setShowAllHistory(!showAllHistory)}
                  className="mt-3 py-3 bg-gray-50 rounded-xl items-center"
                >
                  <Text className="text-emerald-600 font-bold text-sm">
                    {showAllHistory
                      ? 'Show Less'
                      : `Show All ${allTxHistory.length} Transactions`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── Bank Account ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-3">Bank Account</Text>

          {bankDetails.data ? (
            <>
              <View className="bg-blue-50 rounded-xl p-4 mb-3">
                <View className="flex-row items-start justify-between mb-3">
                  <View>
                    <Text className="text-gray-600 text-xs mb-1">Bank Name</Text>
                    <Text className="text-gray-900 font-bold text-base">
                      {bankDetails.data.bank_name}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${bankDetails.data.is_verified ? 'bg-emerald-100'
                      : bankDetails.data.status === 'rejected' ? 'bg-red-100'
                        : 'bg-orange-100'
                    }`}>
                    <Text className={`text-xs font-semibold ${bankDetails.data.is_verified ? 'text-emerald-700'
                        : bankDetails.data.status === 'rejected' ? 'text-red-700'
                          : 'text-orange-700'
                      }`}>
                      {bankDetails.data.is_verified ? 'Verified'
                        : bankDetails.data.status === 'rejected' ? 'Rejected'
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
                      <Feather
                        name={showBankNumber ? 'eye-off' : 'eye'}
                        size={16}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-xs mb-1">IFSC Code</Text>
                    <Text className="text-gray-900 font-semibold text-sm">
                      {bankDetails.data.ifsc_code}
                    </Text>
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
                    <Text className="text-red-800 text-xs font-semibold mb-1">
                      Rejection Reason:
                    </Text>
                    <Text className="text-red-700 text-xs">
                      {bankDetails.data.rejection_reason}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => router.push('/vendor/profile/documents/bank/update')}
                  className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-2.5 items-center"
                >
                  <Text className="text-blue-700 font-semibold text-sm">View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/vendor/profile/documents/bank/update')}
                  className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 items-center"
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
                onPress={() => router.push('/vendor/profile/documents/bank/update')}
                className="bg-emerald-500 px-6 py-2.5 rounded-xl mt-4"
              >
                <Text className="text-white font-semibold">Add Bank Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Recent Transactions (all types) ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Recent Transactions</Text>

          {recentTransactions.length > 0 ? (
            recentTransactions.slice(0, 5).map((tx) => (
              <View
                key={tx.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
              >
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {safeDateTime(tx.created_at)}
                  </Text>
                </View>
                <Text className={`text-base font-bold ml-2 ${tx.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                  {tx.transaction_type === 'credit' ? '+' : '-'}₹
                  {Number(tx.amount).toLocaleString('en-IN')}
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

        {/* Info */}
        <View className="bg-blue-50 mx-4 mb-6 rounded-xl p-4 border border-blue-200">
          <Text className="text-blue-900 font-semibold text-sm mb-2">Settlement Information</Text>
          <Text className="text-blue-800 text-xs leading-5">
            {'• Settlement cycle: T+2 business days\n• Minimum cashout: ₹1,000\n• Admin approval required\n• Funds transferred to your verified bank account'}
          </Text>
        </View>

      </ScrollView>

      {/* Blur overlay */}
      {(cashoutModalVisible || cancelModal || confirmCashoutModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* ── Cashout Modal ── */}
      <Modal
        visible={cashoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCashoutModalVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Request Cashout</Text>
              <TouchableOpacity onPress={() => setCashoutModalVisible(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="bg-emerald-50 rounded-xl p-3 mb-4 border border-emerald-200">
              <Text className="text-emerald-700 text-xs font-semibold mb-1">
                Available to Withdraw
              </Text>
              <Text className="text-emerald-600 text-3xl font-bold">
                ₹{availableBalance.toLocaleString('en-IN')}
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
              Minimum: ₹1,000 · Maximum: ₹{availableBalance.toLocaleString('en-IN')}
            </Text>

            {cashoutAmount && parseInt(cashoutAmount) > 0 && (
              <View className="bg-gray-50 rounded-xl p-3 mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600 text-sm">Cashout Amount</Text>
                  <Text className="text-gray-900 font-semibold">
                    ₹{parseInt(cashoutAmount).toLocaleString('en-IN')}
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
              className={`bg-emerald-500 rounded-xl py-4 items-center justify-center ${requestCashout.isPending ? 'opacity-50' : ''
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

      {/* ── Confirm Cashout Modal ── */}
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
                  ₹{pendingCashoutAmount.toLocaleString('en-IN')}
                </Text>
                ?{'\n\n'}You'll receive this within 2 business days after admin approval.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-emerald-500 py-4 rounded-xl items-center justify-center mb-3"
              onPress={handleConfirmCashout}
              disabled={requestCashout.isPending}
            >
              {requestCashout.isPending
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-base">Confirm</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              className="border-2 border-gray-200 py-4 rounded-xl items-center"
              onPress={() => setConfirmCashoutModal(false)}
              disabled={requestCashout.isPending}
            >
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Cancel Cashout Modal ── */}
      <Modal
        visible={cancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setCancelModal(false); setCashoutIdToCancel(null); }}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => { setCancelModal(false); setCashoutIdToCancel(null); }}
        >
          <Pressable className="bg-white rounded-3xl p-6 w-full">
            <View className="items-center mb-5">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                <Feather name="x-circle" size={30} color="#dc2626" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Cancel Cashout Request?</Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                The amount will be returned to your available balance.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-red-500 py-4 rounded-xl items-center justify-center mb-3"
              onPress={confirmCancelCashout}
              disabled={cancelCashout.isPending}
            >
              {cancelCashout.isPending
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-bold text-base">Yes, Cancel</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              className="border-2 border-gray-200 py-4 rounded-xl items-center"
              onPress={() => { setCancelModal(false); setCashoutIdToCancel(null); }}
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