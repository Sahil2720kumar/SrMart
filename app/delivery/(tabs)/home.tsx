// app/delivery/(tabs)/index.tsx
import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import DeliveryConfirmationModal from '@/components/Deliveryconfirmationmodal';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import {
  useDeliveryBoyProfile,
  useDeliveryBoyKycDocuments,
  useDeliveryBoyKycSummary,
  useUpdateDeliveryBoyProfile,
} from '@/hooks/queries/useDeliveryBoy';
import {
  useAvailableDeliveryGroups,
  useActiveDeliveryGroups,
  useAcceptDeliveryGroup,
  useCompleteGroupDelivery,
  useDeliveryBoyStats,
  type DeliveryGroup,
} from '@/hooks/queries/useDeliveryGroups';
import Toast from 'react-native-toast-message';

// ─── KYC document types ───────────────────────────────────────────────────────

const KYC_DOCUMENTS = {
  aadhaar:         'Aadhaar Card',
  pan:             'PAN Card',
  driving_license: 'Driving License',
  bank_passbook:   'Bank Passbook',
  profile_photo:   'Profile Photo',
} as const;

type KycDocumentType = keyof typeof KYC_DOCUMENTS;

// ─── Main Component ───────────────────────────────────────────────────────────

const DeliveryPartnerHome = () => {
  const router  = useRouter();
  const session = useAuthStore((state) => state.session);
  const userId  = session?.user?.id;

  const profile      = useDeliveryBoyProfile(userId);
  const kycSummary   = useDeliveryBoyKycSummary(userId || '');
  const kycDocuments = useDeliveryBoyKycDocuments(userId || '');
  const stats        = useDeliveryBoyStats();

  const availableGroups = useAvailableDeliveryGroups();
  const activeGroups    = useActiveDeliveryGroups();

  const updateProfile    = useUpdateDeliveryBoyProfile();
  const acceptGroup      = useAcceptDeliveryGroup();
  const completeDelivery = useCompleteGroupDelivery();

  const [showOrdersModal, setShowOrdersModal]               = useState(false);
  const [showOtpModal, setShowOtpModal]                     = useState(false);
  const [selectedGroupForOtp, setSelectedGroupForOtp]       = useState<DeliveryGroup | null>(null);
  const [otpInput, setOtpInput]                             = useState('');
  const [showAcceptModal, setShowAcceptModal]               = useState(false);
  const [selectedGroupForAccept, setSelectedGroupForAccept] = useState<DeliveryGroup | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const name = profile.data
    ? `${profile.data.first_name || ''} ${profile.data.last_name || ''}`.trim()
    : 'User';

  const isOnline    = profile.data?.is_online    || false;
  const adminStatus = profile.data?.admin_verification_status || 'pending';
  const isVerified  = adminStatus === 'approved' && kycSummary.isComplete;

  const isDocumentVerified = (docType: KycDocumentType) => {
    const doc = kycDocuments.data?.find((d) => d.document_type === docType);
    return doc?.status === 'verified' || doc?.status === 'approved';
  };

  const kycSteps = [
    { id: 'aadhaar',         title: KYC_DOCUMENTS.aadhaar,         status: isDocumentVerified('aadhaar')         ? 'completed' : 'pending' },
    { id: 'pan',             title: KYC_DOCUMENTS.pan,             status: isDocumentVerified('pan')             ? 'completed' : 'pending' },
    { id: 'driving_license', title: KYC_DOCUMENTS.driving_license, status: isDocumentVerified('driving_license') ? 'completed' : 'pending' },
    { id: 'bank_passbook',   title: KYC_DOCUMENTS.bank_passbook,   status: isDocumentVerified('bank_passbook')   ? 'completed' : 'pending' },
    { id: 'profile_photo',   title: KYC_DOCUMENTS.profile_photo,   status: isDocumentVerified('profile_photo')   ? 'completed' : 'pending' },
  ];

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleToggleOnline = async () => {
    try {
      await updateProfile.mutateAsync({
        is_online:    !isOnline,
        is_available: !isOnline,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status', position: 'top' });
    }
  };

  const handleAcceptGroupPress = (group: DeliveryGroup) => {
    setSelectedGroupForAccept(group);
    setShowAcceptModal(true);
  };

  const handleConfirmAcceptGroup = async () => {
    if (!selectedGroupForAccept) return;
    try {
      await acceptGroup.mutateAsync(selectedGroupForAccept.id);
      setShowAcceptModal(false);
      setSelectedGroupForAccept(null);
      setShowOrdersModal(false);
      Toast.show({
        type:  'success',
        text1: 'Group accepted!',
        text2: `Pick up from ${selectedGroupForAccept.vendors.length} vendor(s)`,
        position: 'top',
      });
    } catch (error: any) {
      setShowAcceptModal(false);
      Toast.show({ type: 'error', text1: error.message || 'Failed to accept group', position: 'top' });
    }
  };

  const handleStartDelivery = (group: DeliveryGroup) => {
    setSelectedGroupForOtp(group);
    setShowOtpModal(true);
    setOtpInput('');
  };

  const handleVerifyOtp = async () => {
    if (!selectedGroupForOtp) return;
    try {
      await completeDelivery.mutateAsync({
        groupId: selectedGroupForOtp.id,
        otp:     otpInput,
      });
      setShowOtpModal(false);
      setOtpInput('');
      setSelectedGroupForOtp(null);
      Toast.show({
        type:  'success',
        text1: 'Delivered successfully!',
        text2: selectedGroupForOtp.payment_method === 'cod'
          ? 'Please deposit cash at the office.'
          : `₹${selectedGroupForOtp.delivery_fee.toFixed(2)} earned`,
        position: 'top',
      });
    } catch (error: any) {
      Toast.show({
        type:  'error',
        text1: 'Invalid OTP',
        text2: error.message || 'Please try again.',
        position: 'top',
      });
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  const isLoading = profile.isLoading || stats.isLoading || kycDocuments.isLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-600 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  // ── Stats values (client-side calculated) ────────────────────────────────────

  const earningsToday      = stats.data?.earningsToday      ?? 0;
  const earningsThisWeek   = stats.data?.earningsThisWeek   ?? 0;
  const availableBalance   = stats.data?.availableBalance   ?? 0;
  const completedGroups    = stats.data?.completedGroups    ?? 0;
  const activeGroupCount   = activeGroups.data?.length       ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 py-6">

          {/* ── Header ── */}
          <View className="mb-6 mt-4">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-2xl font-bold text-white mb-1">Hello, {name}</Text>
                <Text className="text-indigo-100 text-sm">Ready to deliver excellence</Text>
              </View>
              <TouchableOpacity
                onPress={handleToggleOnline}
                className={`px-6 py-3 rounded-full shadow-lg flex-row items-center gap-2 ${
                  isOnline ? 'bg-green-500' : 'bg-white/20 border border-white/30'
                }`}
                activeOpacity={0.8}
                disabled={updateProfile.isPending}
              >
                <View className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-300'}`} />
                <Text className="font-bold text-white">
                  {updateProfile.isPending ? 'Loading...' : isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Stats row — client-side calculated earnings ── */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/20 border border-white/30 px-4 py-3 rounded-2xl">
                <Text className="text-xs text-indigo-100 mb-1">Active Groups</Text>
                <Text className="text-2xl font-bold text-white">{activeGroupCount}</Text>
              </View>
              <View className="flex-1 bg-white/20 border border-white/30 px-4 py-3 rounded-2xl">
                <Text className="text-xs text-indigo-100 mb-1">Today's Earnings</Text>
                <Text className="text-2xl font-bold text-white">
                  ₹{earningsToday.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Active Groups ── */}
          {activeGroups.data && activeGroups.data.length > 0 ? (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-white">
                  Active Orders ({activeGroups.data.length})
                </Text>
                {isOnline && (
                  <TouchableOpacity
                    onPress={() => setShowOrdersModal(true)}
                    className="bg-white/20 border border-white/30 px-4 py-2 rounded-full"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-semibold text-sm">+ Add Order</Text>
                  </TouchableOpacity>
                )}
              </View>

              {activeGroups.data.map((group) => {
                const isCod     = group.payment_method === 'cod';
                const codStatus = group.cod_status;

                return (
                  <View key={group.id} className="bg-white rounded-3xl p-5 mb-4 shadow-lg">

                    {/* Group header */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-xs text-gray-500 font-bold">
                            {group.vendors.length} VENDOR{group.vendors.length > 1 ? 'S' : ''}
                          </Text>
                          {isCod && (
                            <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                              <Text className="text-amber-700 text-xs font-bold">COD</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                          {group.orders.length} order{group.orders.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View className={`px-3 py-1.5 rounded-full ${
                        group.assignment_status === 'assigned'   ? 'bg-blue-100'   :
                        group.assignment_status === 'delivering' ? 'bg-purple-100' :
                        'bg-green-100'
                      }`}>
                        <Text className={`text-xs font-bold ${
                          group.assignment_status === 'assigned'   ? 'text-blue-700'   :
                          group.assignment_status === 'delivering' ? 'text-purple-700' :
                          'text-green-700'
                        }`}>
                          {group.assignment_status === 'assigned'   ? 'Collecting' :
                           group.assignment_status === 'delivering' ? 'Delivering' :
                           'Completed'}
                        </Text>
                      </View>
                    </View>

                    {/* Vendor stops */}
                    {group.vendors.slice(0, 2).map((vendor, idx) => (
                      <View key={vendor.vendor_id} className="flex-row items-center p-2 bg-blue-50 rounded-lg mb-2">
                        <View className="w-5 h-5 bg-indigo-100 rounded-full items-center justify-center mr-2">
                          <Text className="text-xs font-bold text-indigo-600">{idx + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                            {vendor.vendor_name}
                          </Text>
                          <Text className="text-xs text-gray-500" numberOfLines={1}>
                            {vendor.address}
                          </Text>
                        </View>
                        {['picked_up', 'out_for_delivery'].includes(vendor.status) && (
                          <Feather name="check-circle" size={14} color="#22c55e" />
                        )}
                      </View>
                    ))}
                    {group.vendors.length > 2 && (
                      <Text className="text-xs text-gray-400 mb-2 ml-2">
                        +{group.vendors.length - 2} more vendor(s)
                      </Text>
                    )}

                    {/* Customer */}
                    <View className="flex-row items-center p-2 bg-green-50 rounded-lg mb-3">
                      <Feather name="map-pin" size={14} color="#22c55e" />
                      <View className="flex-1 ml-2">
                        <Text className="text-xs text-green-600 font-bold">DELIVER TO</Text>
                        <Text className="text-sm font-semibold text-gray-900">{group.customer.name}</Text>
                      </View>
                    </View>

                    {/* Payout */}
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-xs text-gray-500">Delivery payout</Text>
                      <Text className="font-bold text-green-600">
                        ₹{group.delivery_fee.toFixed(2)}
                      </Text>
                    </View>

                    {/* COD badge */}
                    {isCod && (
                      <View className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 flex-row items-center gap-2">
                        <Feather name="alert-circle" size={14} color="#d97706" />
                        <Text className="text-amber-700 text-xs font-medium flex-1">
                          COD — Collect ₹{group.total_amount.toFixed(2)} cash at delivery
                        </Text>
                      </View>
                    )}

                    {/* Action button */}
                    {group.assignment_status === 'delivering' ? (
                      <TouchableOpacity
                        onPress={() => handleStartDelivery(group)}
                        className="bg-green-500 py-3 rounded-xl flex-row items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <Feather name="lock" size={16} color="white" />
                        <Text className="text-white font-bold ml-2">Enter OTP to Deliver</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => router.push(`/delivery/order/${group.id}`)}
                        className="bg-indigo-600 py-3 rounded-xl flex-row items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <Feather name="package" size={16} color="white" />
                        <Text className="text-white font-bold ml-2">View Pickup Details</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-white/10 border border-white/20 rounded-3xl p-8 mb-6">
              <View className="items-center">
                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                  <Feather name="inbox" size={40} color="white" />
                </View>
                <Text className="text-white font-bold text-lg mb-2">No Active Orders</Text>
                <Text className="text-indigo-100 text-sm text-center mb-4">
                  {isOnline ? 'Browse available orders to get started' : 'Go online to see available orders'}
                </Text>
                {isOnline && (
                  <TouchableOpacity
                    onPress={() => setShowOrdersModal(true)}
                    className="bg-white px-6 py-3 rounded-full shadow-lg"
                    activeOpacity={0.8}
                  >
                    <Text className="text-indigo-600 font-bold">Browse Orders</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Today's Performance ── */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-white mb-4">Today's Performance</Text>
            <View className="flex-row gap-3">
              <StatCard
                icon="package"
                label="Completed"
                value={completedGroups}
                bgColor="bg-indigo-500"
              />
              <StatCard
                icon="dollar-sign"
                label="Today"
                value={`₹${earningsToday.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                bgColor="bg-green-500"
              />
              <StatCard
                icon="credit-card"
                label="Wallet"
                value={`₹${availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                bgColor="bg-blue-500"
              />
            </View>
          </View>

          {/* ── This week summary ── */}
          {earningsThisWeek > 0 && (
            <View className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-indigo-100 text-xs font-semibold mb-1">This Week</Text>
                  <Text className="text-white text-2xl font-bold">
                    ₹{earningsThisWeek.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                  <Feather name="trending-up" size={22} color="white" />
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── Available Orders Modal ── */}
      <Modal
        visible={showOrdersModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOrdersModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
            <View className="p-6 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold text-gray-900">Available Orders</Text>
                <TouchableOpacity onPress={() => setShowOrdersModal(false)}>
                  <Feather name="x" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-500">
                {availableGroups.data?.length || 0} order groups available
              </Text>
            </View>

            {availableGroups.isLoading ? (
              <View className="p-8 items-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-gray-500 mt-4">Loading orders...</Text>
              </View>
            ) : availableGroups.data && availableGroups.data.length > 0 ? (
              <FlatList
                data={availableGroups.data}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item: group }) => (
                  <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-xs text-gray-500 font-bold">
                            {group.vendors.length} VENDOR{group.vendors.length > 1 ? 'S' : ''}
                          </Text>
                          <Text className="text-xs text-gray-400">·</Text>
                          <Text className="text-xs text-gray-500 font-bold">
                            {group.payment_method.toUpperCase()}
                          </Text>
                        </View>
                        <Text className="text-base font-bold text-gray-900">
                          {group.orders.length} order{group.orders.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                      <View className="bg-indigo-50 px-4 py-2 rounded-full">
                        <Text className="text-indigo-600 font-bold">
                          ₹{group.delivery_fee.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* Vendor stops */}
                    {group.vendors.map((vendor, idx) => (
                      <View key={vendor.vendor_id} className="flex-row items-start p-3 bg-blue-50 rounded-lg mb-2">
                        <Feather name="shopping-bag" size={16} color="#3b82f6" />
                        <View className="flex-1 ml-2">
                          <Text className="text-xs text-blue-600 font-bold">PICKUP {idx + 1}</Text>
                          <Text className="font-semibold text-gray-900">{vendor.vendor_name}</Text>
                          <Text className="text-xs text-gray-600" numberOfLines={1}>{vendor.address}</Text>
                          <Text className="text-xs text-gray-500 mt-0.5">
                            {vendor.items.filter((i) => i.status !== 'cancelled').length} items
                          </Text>
                        </View>
                      </View>
                    ))}

                    {/* Customer */}
                    <View className="flex-row items-start p-3 bg-green-50 rounded-lg mb-4">
                      <Feather name="map-pin" size={16} color="#22c55e" />
                      <View className="flex-1 ml-2">
                        <Text className="text-xs text-green-600 font-bold">DELIVER TO</Text>
                        <Text className="font-semibold text-gray-900">{group.customer.name}</Text>
                        <Text className="text-xs text-gray-600" numberOfLines={1}>
                          {group.customer.address}
                        </Text>
                      </View>
                    </View>

                    {/* Info row */}
                    <View className="flex-row gap-2 mb-4">
                      <View className="flex-1 bg-gray-50 rounded-lg p-2">
                        <Text className="text-xs text-gray-500">Distance</Text>
                        <Text className="font-bold text-gray-900 text-sm">
                          {group.distance.toFixed(1)} km
                        </Text>
                      </View>
                      <View className="flex-1 bg-gray-50 rounded-lg p-2">
                        <Text className="text-xs text-gray-500">Items</Text>
                        <Text className="font-bold text-gray-900 text-sm">{group.totalItems}</Text>
                      </View>
                      <View className="flex-1 bg-gray-50 rounded-lg p-2">
                        <Text className="text-xs text-gray-500">Vendors</Text>
                        <Text className="font-bold text-gray-900 text-sm">{group.vendors.length}</Text>
                      </View>
                    </View>

                    {/* COD badge */}
                    {group.payment_method === 'cod' && (
                      <View className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 flex-row items-center gap-2">
                        <Feather name="alert-circle" size={14} color="#d97706" />
                        <Text className="text-amber-700 text-xs font-medium">
                          COD — Collect ₹{group.total_amount.toFixed(2)} cash at delivery
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => handleAcceptGroupPress(group)}
                      className="bg-indigo-600 py-3 rounded-xl shadow-md"
                      activeOpacity={0.8}
                      disabled={acceptGroup.isPending}
                    >
                      {acceptGroup.isPending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-bold text-center">Accept Group</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <View className="p-8 items-center">
                <Feather name="inbox" size={48} color="#9ca3af" />
                <Text className="text-gray-500 mt-4 text-center">
                  No available orders at the moment
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Accept Confirmation Modal ── */}
      <DeliveryConfirmationModal
        visible={showAcceptModal}
        onClose={() => { setShowAcceptModal(false); setSelectedGroupForAccept(null); }}
        onConfirm={handleConfirmAcceptGroup}
        title="Accept Group?"
        message={`Pick up from ${selectedGroupForAccept?.vendors.length ?? 0} vendor(s) and deliver to ${selectedGroupForAccept?.customer.name}. Payout: ₹${selectedGroupForAccept?.delivery_fee.toFixed(2) ?? '0.00'}`}
        confirmText="Accept"
        cancelText="Cancel"
        isLoading={acceptGroup.isPending}
        icon="check-circle"
        iconColor="#6366f1"
      />

      {/* ── OTP Verification Modal ── */}
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon, label, value, bgColor,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: any;
  bgColor: string;
}) => (
  <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
    <View className={`w-10 h-10 ${bgColor} rounded-xl items-center justify-center mb-3`}>
      <Feather name={icon} size={20} color="white" />
    </View>
    <Text className="text-xs text-gray-500 mb-1 font-semibold">{label}</Text>
    <Text className="text-xl font-bold text-gray-900">{value}</Text>
  </View>
);

export default DeliveryPartnerHome;