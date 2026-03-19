// app/delivery/orders.tsx
import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import DeliveryConfirmationModal from '@/components/Deliveryconfirmationmodal';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import {
  useAvailableDeliveryGroups,
  useActiveDeliveryGroups,
  useCompletedDeliveryGroups,
  useDeliveryBoyStats,
  useAcceptDeliveryGroup,
  useCompleteGroupDelivery,
  useReportCodDeposit,
  type DeliveryGroup,
} from '@/hooks/queries/useDeliveryGroups';

const DeliveryOrderScreen = () => {
  const router  = useRouter();
  const store   = useDeliveryStore();
  const { adminVerificationStatus, isKycCompleted } = store;
  const isVerified = adminVerificationStatus === 'approved' && isKycCompleted;

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');

  const [showAcceptModal, setShowAcceptModal]           = useState(false);
  const [selectedGroup, setSelectedGroup]               = useState<DeliveryGroup | null>(null);
  const [showOtpModal, setShowOtpModal]                 = useState(false);
  const [otpInput, setOtpInput]                         = useState('');
  const [selectedGroupForOtp, setSelectedGroupForOtp]   = useState<DeliveryGroup | null>(null);
  const [showDepositModal, setShowDepositModal]         = useState(false);
  const [selectedGroupForDeposit, setSelectedGroupForDeposit] = useState<DeliveryGroup | null>(null);

  const {
    data: availableGroups = [], isLoading: loadingAvailable,
    refetch: refetchAvailable, isRefetching: refetchingAvailable,
  } = useAvailableDeliveryGroups();

  const {
    data: activeGroups = [], isLoading: loadingActive,
    refetch: refetchActive, isRefetching: refetchingActive,
  } = useActiveDeliveryGroups();

  const {
    data: completedGroups = [], isLoading: loadingCompleted,
    refetch: refetchCompleted, isRefetching: refetchingCompleted,
  } = useCompletedDeliveryGroups();

  const { data: stats } = useDeliveryBoyStats();

  const acceptGroupMutation       = useAcceptDeliveryGroup();
  const completeGroupMutation     = useCompleteGroupDelivery();
  const reportDepositMutation     = useReportCodDeposit();

  const handleRefresh = () => {
    if (activeTab === 'available')      refetchAvailable();
    else if (activeTab === 'active')    refetchActive();
    else                                refetchCompleted();
  };

  const getGroupsForTab = () => {
    switch (activeTab) {
      case 'available': return availableGroups;
      case 'active':    return activeGroups;
      case 'completed': return completedGroups;
      default:          return [];
    }
  };

  // ── Accept flow ──────────────────────────────────────────────────────────
  const handleAcceptPress = (group: DeliveryGroup) => {
    setSelectedGroup(group);
    setShowAcceptModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedGroup) return;
    try {
      await acceptGroupMutation.mutateAsync(selectedGroup.id);
      setShowAcceptModal(false);
      setSelectedGroup(null);
      Toast.show({
        type:  'success',
        text1: 'Order group accepted!',
        text2: `Pick up from ${selectedGroup.vendors.length} vendor(s)`,
        position: 'top',
      });
      setActiveTab('active');
    } catch (error: any) {
      setShowAcceptModal(false);
      Toast.show({ type: 'error', text1: error.message || 'Failed to accept.', position: 'top' });
    }
  };

  // ── Complete delivery flow ────────────────────────────────────────────────
  const handleDeliverPress = (group: DeliveryGroup) => {
    setSelectedGroupForOtp(group);
    setShowOtpModal(true);
    setOtpInput('');
  };

  const handleVerifyOtp = async () => {
    if (!selectedGroupForOtp) return;
    try {
      await completeGroupMutation.mutateAsync({
        groupId: selectedGroupForOtp.id,
        otp:     otpInput,
      });
      setShowOtpModal(false);
      setOtpInput('');
      setSelectedGroupForOtp(null);
      Toast.show({
        type:  'success',
        text1: 'Delivery complete!',
        text2: selectedGroupForOtp.payment_method === 'cod'
          ? 'Please deposit cash at the office.'
          : `₹${selectedGroupForOtp.delivery_fee.toFixed(2)} earned`,
        position: 'top',
      });
      setActiveTab('completed');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Invalid OTP.', position: 'top' });
    }
  };

  // ── COD deposit flow ─────────────────────────────────────────────────────
  const handleDepositPress = (group: DeliveryGroup) => {
    setSelectedGroupForDeposit(group);
    setShowDepositModal(true);
  };

  const handleConfirmDeposit = async () => {
    if (!selectedGroupForDeposit) return;
    try {
      await reportDepositMutation.mutateAsync(selectedGroupForDeposit.id);
      setShowDepositModal(false);
      setSelectedGroupForDeposit(null);
      Toast.show({
        type:  'success',
        text1: 'Deposit reported!',
        text2: 'Admin will verify and credit your wallet.',
        position: 'top',
      });
      refetchCompleted();
    } catch (error: any) {
      setShowDepositModal(false);
      Toast.show({ type: 'error', text1: error.message || 'Failed to report deposit.', position: 'top' });
    }
  };

  const handleNavigate = (group: DeliveryGroup) => {
    const { lat, lng } = group.customer;
    if (lat && lng)
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const getPickedUpCount = (group: DeliveryGroup) =>
    group.vendors.filter((v) =>
      ['picked_up', 'out_for_delivery', 'delivered'].includes(v.status)
    ).length;

  // ── COD status helpers ───────────────────────────────────────────────────
  const getCodBadge = (group: DeliveryGroup) => {
    if (group.payment_method !== 'cod') return null;
    switch (group.cod_status) {
      case 'pending_deposit':
        return { label: 'Deposit needed', bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'deposit_reported':
        return { label: 'Under review', bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'deposited':
        return { label: 'Deposit confirmed', bg: 'bg-green-100', text: 'text-green-700' };
      default:
        return { label: 'COD', bg: 'bg-amber-100', text: 'text-amber-700' };
    }
  };

  const isLoading    = loadingAvailable || loadingActive || loadingCompleted;
  const isRefreshing = refetchingAvailable || refetchingActive || refetchingCompleted;

  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-white mb-4">Deliveries</Text>

        {/* Stats */}
        {isVerified && stats && (
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Total</Text>
              <Text className="text-xl font-bold text-white">{stats.totalGroups}</Text>
            </View>
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Today</Text>
              <Text className="text-xl font-bold text-white">₹{stats.earningsToday}</Text>
            </View>
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Wallet</Text>
              <Text className="text-xl font-bold text-white">₹{stats.availableBalance}</Text>
            </View>
          </View>
        )}

        {/* Tab bar */}
        <View className="bg-indigo-500 rounded-2xl p-1 flex-row">
          {(['available', 'active', 'completed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl ${
                activeTab === tab ? 'bg-white' : 'bg-transparent'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-bold text-sm ${
                activeTab === tab ? 'text-indigo-600' : 'text-white/70'
              }`}>
                {tab === 'available' ? 'Available'
                  : tab === 'active' ? `Active (${activeGroups.length})`
                  : 'Completed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Verification gate */}
      {!isVerified ? (
        <View className="px-4 pt-4">
          <View className="bg-orange-50 border-l-4 border-orange-400 p-5 rounded-2xl">
            <Text className="font-bold text-orange-900 mb-1">Verification Required</Text>
            <Text className="text-sm text-orange-800">
              Complete KYC and admin verification to receive orders.
            </Text>
          </View>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="white"
            />
          }
        >
          {getGroupsForTab().length === 0 ? (
            <View className="bg-white/10 border border-white/20 rounded-3xl p-8 items-center mt-8">
              <Feather name="inbox" size={40} color="white" />
              <Text className="text-white font-bold text-lg mt-4 mb-2">No Orders</Text>
              <Text className="text-indigo-100 text-sm text-center">
                {activeTab === 'available' && 'No orders available right now'}
                {activeTab === 'active'    && 'No active deliveries'}
                {activeTab === 'completed' && 'No completed deliveries yet'}
              </Text>
            </View>
          ) : (
            getGroupsForTab().map((group) => {
              const codBadge    = getCodBadge(group);
              const codPending  = group.payment_method === 'cod' && group.cod_status === 'pending_deposit';
              const codReported = group.payment_method === 'cod' && group.cod_status === 'deposit_reported';
              const codDone     = group.payment_method === 'cod' && group.cod_status === 'deposited';

              return (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => router.push(`/delivery/order/${group.id}`)}
                  activeOpacity={0.9}
                >
                  <View className={`bg-white rounded-3xl p-5 mb-4 shadow-lg ${
                    codPending ? 'border-2 border-amber-300' : ''
                  }`}>

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-xs text-gray-500 font-bold tracking-wider">
                            {group.vendors.length} VENDOR{group.vendors.length > 1 ? 'S' : ''}
                          </Text>
                          {/* COD badge */}
                          {codBadge && (
                            <View className={`px-2 py-0.5 rounded-full ${codBadge.bg}`}>
                              <Text className={`text-xs font-bold ${codBadge.text}`}>
                                {codBadge.label}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                          {group.orders.length} order{group.orders.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View className={`px-4 py-2 rounded-full ${
                        group.assignment_status === 'broadcasting' ? 'bg-yellow-100'
                        : group.assignment_status === 'assigned'   ? 'bg-blue-100'
                        : group.assignment_status === 'delivering' ? 'bg-purple-100'
                        : 'bg-green-100'
                      }`}>
                        <Text className={`font-bold text-sm ${
                          group.assignment_status === 'broadcasting' ? 'text-yellow-700'
                          : group.assignment_status === 'assigned'   ? 'text-blue-700'
                          : group.assignment_status === 'delivering' ? 'text-purple-700'
                          : 'text-green-700'
                        }`}>
                          {group.assignment_status === 'broadcasting' ? 'Available'
                            : group.assignment_status === 'assigned'   ? 'Assigned'
                            : group.assignment_status === 'delivering' ? 'Delivering'
                            : 'Completed'}
                        </Text>
                      </View>
                    </View>

                    {/* Pickup progress for active */}
                    {activeTab === 'active' && (
                      <View className="mb-4">
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-xs font-semibold text-gray-600">
                            Pickup progress
                          </Text>
                          <Text className="text-xs font-bold text-indigo-600">
                            {getPickedUpCount(group)}/{group.vendors.length} vendors
                          </Text>
                        </View>
                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-indigo-600 rounded-full"
                            style={{
                              width: `${(getPickedUpCount(group) / group.vendors.length) * 100}%`,
                            }}
                          />
                        </View>
                      </View>
                    )}

                    {/* Vendor list */}
                    <View className="mb-3 pb-3 border-b border-gray-100">
                      {group.vendors.slice(0, 2).map((v, idx) => (
                        <View key={v.vendor_id} className="flex-row items-center mb-1">
                          <View className="w-5 h-5 bg-indigo-100 rounded-full items-center justify-center mr-2">
                            <Text className="text-xs font-bold text-indigo-600">{idx + 1}</Text>
                          </View>
                          <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                            {v.vendor_name}
                          </Text>
                          {['picked_up', 'out_for_delivery'].includes(v.status) && (
                            <Feather name="check-circle" size={14} color="#22c55e" />
                          )}
                        </View>
                      ))}
                      {group.vendors.length > 2 && (
                        <Text className="text-xs text-gray-400 ml-7">
                          +{group.vendors.length - 2} more vendor(s)
                        </Text>
                      )}
                    </View>

                    {/* Customer delivery */}
                    <View className="flex-row items-center p-3 bg-green-50 rounded-2xl mb-4">
                      <Feather name="map-pin" size={16} color="#22c55e" />
                      <View className="ml-2 flex-1">
                        <Text className="text-xs text-green-700 font-bold">DELIVER TO</Text>
                        <Text className="font-bold text-gray-900 text-sm">{group.customer.name}</Text>
                        <Text className="text-xs text-gray-500" numberOfLines={1}>
                          {group.customer.address}
                        </Text>
                      </View>
                    </View>

                    {/* Info row */}
                    <View className="flex-row gap-2 mb-4">
                      <View className="flex-1 bg-gray-50 rounded-xl p-3">
                        <Text className="text-xs text-gray-500 mb-1">Distance</Text>
                        <Text className="font-bold text-gray-900">
                          {group.distance.toFixed(1)} km
                        </Text>
                      </View>
                      <View className="flex-1 bg-gray-50 rounded-xl p-3">
                        <Text className="text-xs text-gray-500 mb-1">Orders</Text>
                        <Text className="font-bold text-gray-900">{group.orders.length}</Text>
                      </View>
                      <View className="flex-1 bg-green-50 rounded-xl p-3">
                        <Text className="text-xs text-green-600 mb-1">Payout</Text>
                        <Text className="font-bold text-green-600">
                          ₹{group.delivery_fee.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* ── Action buttons ── */}

                    {activeTab === 'available' && (
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); handleAcceptPress(group); }}
                        className="bg-indigo-600 py-3 rounded-xl flex-row items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <Feather name="check-circle" size={18} color="white" />
                        <Text className="text-white font-bold ml-2">Accept Group</Text>
                      </TouchableOpacity>
                    )}

                    {activeTab === 'active' && (
                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation(); handleNavigate(group); }}
                          className="flex-1 bg-blue-500 py-3 rounded-xl flex-row items-center justify-center"
                          activeOpacity={0.8}
                        >
                          <Feather name="navigation" size={18} color="white" />
                          <Text className="text-white font-bold ml-2">Navigate</Text>
                        </TouchableOpacity>

                        {group.assignment_status === 'delivering' && (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); handleDeliverPress(group); }}
                            className="flex-1 bg-green-500 py-3 rounded-xl flex-row items-center justify-center"
                            activeOpacity={0.8}
                          >
                            <Feather name="lock" size={18} color="white" />
                            <Text className="text-white font-bold ml-2">Enter OTP</Text>
                          </TouchableOpacity>
                        )}

                        {group.assignment_status === 'assigned' && (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); router.push(`/delivery/order/${group.id}`); }}
                            className="flex-1 bg-orange-500 py-3 rounded-xl flex-row items-center justify-center"
                            activeOpacity={0.8}
                          >
                            <Feather name="package" size={18} color="white" />
                            <Text className="text-white font-bold ml-2">Pickup</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {activeTab === 'completed' && (
                      <View className="gap-2">
                        {/* Delivered row */}
                        <View className="bg-green-50 py-3 rounded-xl flex-row items-center justify-center">
                          <Feather name="check-circle" size={16} color="#16a34a" />
                          <Text className="text-green-700 font-bold ml-2 text-sm">
                            Delivered · ₹{group.delivery_fee.toFixed(2)} payout
                          </Text>
                        </View>

                        {/* COD deposit pending */}
                        {codPending && (
                          <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); handleDepositPress(group); }}
                            className="bg-amber-500 py-3 rounded-xl flex-row items-center justify-center"
                            activeOpacity={0.8}
                            disabled={reportDepositMutation.isPending}
                          >
                            {reportDepositMutation.isPending ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <>
                                <Feather name="send" size={16} color="white" />
                                <Text className="text-white font-bold ml-2 text-sm">
                                  Deposit ₹{group.cod_amount?.toFixed(2)} at office
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}

                        {/* COD under review */}
                        {codReported && (
                          <View className="bg-blue-50 border border-blue-200 py-3 rounded-xl flex-row items-center justify-center gap-2">
                            <ActivityIndicator size="small" color="#3b82f6" />
                            <Text className="text-blue-700 font-bold text-sm">
                              Deposit under review — ₹{group.delivery_fee.toFixed(2)} pending
                            </Text>
                          </View>
                        )}

                        {/* COD confirmed */}
                        {codDone && (
                          <View className="bg-green-50 border border-green-200 py-3 rounded-xl flex-row items-center justify-center gap-2">
                            <Feather name="check-circle" size={16} color="#16a34a" />
                            <Text className="text-green-700 font-bold text-sm">
                              ₹{group.delivery_fee.toFixed(2)} credited to wallet
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View className="h-6" />
        </ScrollView>
      )}

      {/* Blur overlay */}
      {(showAcceptModal || showOtpModal || showDepositModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Accept modal */}
      <DeliveryConfirmationModal
        visible={showAcceptModal}
        onClose={() => { setShowAcceptModal(false); setSelectedGroup(null); }}
        onConfirm={handleConfirmAccept}
        title="Accept This Group?"
        message={`Pick up from ${selectedGroup?.vendors.length} vendor(s) and deliver to ${selectedGroup?.customer.name}. Payout: ₹${selectedGroup?.delivery_fee.toFixed(2)}`}
        confirmText="Accept"
        cancelText="Cancel"
        isLoading={acceptGroupMutation.isPending}
        icon="check-circle"
        iconColor="#6366f1"
      />

      {/* COD deposit confirmation modal */}
      <DeliveryConfirmationModal
        visible={showDepositModal}
        onClose={() => { setShowDepositModal(false); setSelectedGroupForDeposit(null); }}
        onConfirm={handleConfirmDeposit}
        title="Confirm Cash Deposit?"
        message={`You are confirming that you have deposited ₹${selectedGroupForDeposit?.cod_amount?.toFixed(2)} at the office. Admin will verify and credit ₹${selectedGroupForDeposit?.delivery_fee.toFixed(2)} to your wallet.`}
        confirmText="Yes, I've Deposited"
        cancelText="Cancel"
        isLoading={reportDepositMutation.isPending}
        icon="dollar-sign"
        iconColor="#d97706"
      />

      {/* OTP modal */}
      <DeliveryOTPVerificationModal
        showOtpModal={showOtpModal}
        setShowOtpModal={setShowOtpModal}
        selectedOrderForOtp={selectedGroupForOtp}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        handleVerifyOtp={handleVerifyOtp}
      />
    </SafeAreaView>
  );
};

export default DeliveryOrderScreen;