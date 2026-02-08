import DeliveryActiveOrderCard from '@/components/DeliveryActiveOrderCard';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// ==========================================
// IMPORT EXISTING HOOKS
// ==========================================
import { useAuthStore } from '@/store/authStore';
import {
  useDeliveryBoyProfile,
  useDeliveryBoyKycDocuments,
  useDeliveryBoyKycSummary,
  useUpdateDeliveryBoyProfile,
} from '@/hooks/queries/useDeliveryBoy';
import {
  useAvailableDeliveryOrders,
  useActiveDeliveryOrders,
  useAcceptDeliveryOrder,
  useMarkOrderPickedUp,
  useCompleteDelivery,
  useDeliveryBoyStats,
} from '@/hooks/queries/useDeliveryOrders';
import { DeliveryOrder } from '@/types/delivery-orders.types';

// ==========================================
// KYC DOCUMENT TYPES
// ==========================================
const KYC_DOCUMENTS = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  driving_license: 'Driving License',
  bank_passbook: 'Bank Passbook',
  profile_photo: 'Profile Photo',
} as const;

type KycDocumentType = keyof typeof KYC_DOCUMENTS;

/* ---------------- MAIN COMPONENT ---------------- */
const DeliveryPartnerHome = () => {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  // Profile and verification data
  const profile = useDeliveryBoyProfile(userId);
  const kycSummary = useDeliveryBoyKycSummary(userId || '');
  const kycDocuments = useDeliveryBoyKycDocuments(userId || '');
  const stats = useDeliveryBoyStats();

  // Orders data
  const availableOrders = useAvailableDeliveryOrders();
  const activeOrders = useActiveDeliveryOrders();

  // Mutations
  const updateProfile = useUpdateDeliveryBoyProfile();
  const acceptOrder = useAcceptDeliveryOrder();
  const markPickedUp = useMarkOrderPickedUp();
  const completeDelivery = useCompleteDelivery();

  // ==========================================
  // LOCAL STATE
  // ==========================================
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState<DeliveryOrder | null>(null);
  const [otpInput, setOtpInput] = useState('');

  // Accept Order Confirmation Modal State
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOrderForAccept, setSelectedOrderForAccept] = useState<DeliveryOrder | null>(null);

  // Pickup Confirmation Modal State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState<DeliveryOrder | null>(null);

  // ==========================================
  // EXTRACT DATA
  // ==========================================

  const name = profile.data
    ? `${profile.data.first_name || ''} ${profile.data.last_name || ''}`.trim()
    : 'User';

  const isOnline = profile.data?.is_online || false;
  const adminStatus = profile.data?.admin_verification_status || 'pending';
  const isKycCompleted = kycSummary.isComplete;
  const isVerified = adminStatus === 'approved' && isKycCompleted;

  // ==========================================
  // BUILD KYC STEPS FROM ACTUAL DOCUMENTS
  // ==========================================

  // Helper to check if document is verified
  const isDocumentVerified = (docType: KycDocumentType) => {
    const doc = kycDocuments.data?.find(d => d.document_type === docType);
    return doc?.status === 'verified' || doc?.status === 'approved';
  };

  // Build KYC steps based on actual KYC documents
  const kycSteps = [
    {
      id: 'aadhaar',
      title: KYC_DOCUMENTS.aadhaar,
      status: isDocumentVerified('aadhaar') ? 'completed' : 'pending'
    },
    {
      id: 'pan',
      title: KYC_DOCUMENTS.pan,
      status: isDocumentVerified('pan') ? 'completed' : 'pending'
    },
    {
      id: 'driving_license',
      title: KYC_DOCUMENTS.driving_license,
      status: isDocumentVerified('driving_license') ? 'completed' : 'pending'
    },
    {
      id: 'bank_passbook',
      title: KYC_DOCUMENTS.bank_passbook,
      status: isDocumentVerified('bank_passbook') ? 'completed' : 'pending'
    },
    {
      id: 'profile_photo',
      title: KYC_DOCUMENTS.profile_photo,
      status: isDocumentVerified('profile_photo') ? 'completed' : 'pending'
    }
  ];

  const kycProgress = kycSteps.filter(s => s.status === 'completed').length;
  const totalKycSteps = kycSteps.length;
  const kycPercentage = (kycProgress / totalKycSteps) * 100;

  // Today's stats
  const todayStats = {
    todayOrders: stats.data?.completedOrders || 0,
    distanceKm: stats.data?.totalDistance || 0,
    earnings: stats.data?.totalEarnings || 0,
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleToggleOnline = async () => {
    try {
      await updateProfile.mutateAsync({
        is_online: !isOnline,
        is_available: !isOnline,
      });
    } catch (error) {
      console.error('Error toggling online status:', error);
      Alert.alert('Error', 'Failed to update online status');
    }
  };

  // Accept Order Flow
  const handleAcceptOrderPress = (order: DeliveryOrder) => {
    setSelectedOrderForAccept(order);
    setShowAcceptModal(true);
  };

  const handleConfirmAcceptOrder = async () => {
    if (!selectedOrderForAccept) return;

    try {
      await acceptOrder.mutateAsync(selectedOrderForAccept.id);
      setShowAcceptModal(false);
      setSelectedOrderForAccept(null);
      setShowOrdersModal(false);
      Alert.alert('Success', 'Order accepted successfully! 🎉');
    } catch (error: any) {
      setShowAcceptModal(false);
      Alert.alert('Error', error.message || 'Failed to accept order');
    }
  };

  // Mark Picked Up Flow
  const handleMarkPickedUpPress = (order: DeliveryOrder) => {
    setSelectedOrderForPickup(order);
    setShowPickupModal(true);
  };

  const handleConfirmMarkPickedUp = async () => {
    if (!selectedOrderForPickup) return;

    try {
      await markPickedUp.mutateAsync(selectedOrderForPickup.id);
      setShowPickupModal(false);
      setSelectedOrderForPickup(null);
      Alert.alert('Success', 'Order marked as picked up! 📦');
    } catch (error: any) {
      setShowPickupModal(false);
      Alert.alert('Error', error.message || 'Failed to mark order as picked up');
    }
  };

  // Complete Delivery Flow
  const handleStartDelivery = (order: DeliveryOrder) => {
    setSelectedOrderForOtp(order);
    setShowOtpModal(true);
    setOtpInput('');
  };

  const handleVerifyOtp = async () => {
    if (!selectedOrderForOtp) return;

    try {
      await completeDelivery.mutateAsync({
        orderId: selectedOrderForOtp.id,
        otp: otpInput,
      });

      setShowOtpModal(false);
      setOtpInput('');
      setSelectedOrderForOtp(null);
      Alert.alert('Success!', 'Order delivered successfully! 🎉');
    } catch (error: any) {
      console.error('Error completing delivery:', error);
      Alert.alert('Invalid OTP', error.message || 'Please try again.');
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  const isLoading = profile.isLoading || stats.isLoading || kycDocuments.isLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-600 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 py-6">
          {isVerified ? (
            <>
              <View className="items-center mb-8 mt-4">
                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                  <Feather name="package" size={40} color="white" />
                </View>
                <Text className="text-3xl font-bold text-white mb-2 text-center">
                  Welcome {name}
                </Text>
                <Text className="text-indigo-100 text-sm text-center">
                  Complete verification to start earning
                </Text>
              </View>
              {/* Verification Status Alert */}
              <View className="bg-orange-50 border-l-4 border-orange-400 p-5 rounded-2xl mb-6 shadow-sm">
                <View className="flex-row gap-4">
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                    <Feather name="alert-circle" size={20} color="#ea580c" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-orange-900 mb-1">Verification Required</Text>
                    <Text className="text-sm text-orange-800 leading-5">
                      Complete KYC and admin verification to receive and manage orders.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Admin Verification Status */}
              <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                <Text className="text-lg font-bold text-gray-900 mb-4">Admin Approval Status</Text>

                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-gray-700">Verification Status</Text>
                  <View className={`px-3 py-1.5 rounded-full ${adminStatus === 'approved' ? 'bg-green-500' :
                      adminStatus === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                    }`}>
                    <Text className="text-white text-xs font-bold">
                      {adminStatus === 'approved' ? 'Approved' :
                        adminStatus === 'pending' ? 'Pending' :
                          'Rejected'}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-3">
                  {adminStatus === 'approved' ? 'Orders enabled' :
                    adminStatus === 'pending' ? 'Verification in progress' :
                      'Action required'}
                </Text>

                {adminStatus === 'rejected' && (
                  <TouchableOpacity
                    className="bg-red-50 border border-red-200 py-3 rounded-xl"
                    activeOpacity={0.8}
                    onPress={() => router.push('/delivery/profile/documents')}
                  >
                    <Text className="text-red-600 font-bold text-center">
                      Fix & Resubmit Details
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* KYC Progress Card */}
              <View className="bg-white rounded-3xl p-5 mb-6 shadow-lg">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-gray-900">Identity Verification</Text>
                  <Text className="text-sm font-bold text-indigo-600">
                    {kycProgress}/{totalKycSteps}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <View
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${kycPercentage}%` }}
                  />
                </View>

                {/* KYC Steps */}
                <View className="gap-y-3 mb-4">
                  {kycSteps.map((step) => (
                    <View key={step.id} className="flex-row items-center">
                      <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                        }`}>
                        {step.status === 'completed' ? (
                          <Feather name="check" size={14} color="white" />
                        ) : (
                          <View className="w-2 h-2 rounded-full bg-gray-400" />
                        )}
                      </View>
                      <Text className={`font-semibold ${step.status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                        {step.title}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  className="bg-indigo-600 py-3 rounded-xl"
                  activeOpacity={0.8}
                  onPress={() => router.push('/delivery/profile/documents')}
                >
                  <Text className="text-white font-bold text-center">
                    {kycSummary.isComplete ? 'View Documents' : 'Complete Verification'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Header */}
              <View className="mb-6 mt-4">
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-2xl font-bold text-white mb-1">
                      Hello, {name}
                    </Text>
                    <Text className="text-indigo-100 text-sm">Ready to deliver excellence</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleToggleOnline}
                    className={`px-6 py-3 rounded-full shadow-lg flex-row items-center gap-2 ${isOnline
                        ? 'bg-green-500'
                        : 'bg-white/20 border border-white/30'
                      }`}
                    activeOpacity={0.8}
                    disabled={updateProfile.isPending}
                  >
                    <View
                      className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-300'
                        }`}
                    />
                    <Text className="font-bold text-white">
                      {updateProfile.isPending
                        ? 'Loading...'
                        : isOnline
                          ? 'Online'
                          : 'Offline'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-white/20 border border-white/30 px-4 py-3 rounded-2xl">
                    <Text className="text-xs text-indigo-100 mb-1">Active Orders</Text>
                    <Text className="text-2xl font-bold text-white">
                      {activeOrders.data?.length || 0}
                    </Text>
                  </View>
                  <View className="flex-1 bg-white/20 border border-white/30 px-4 py-3 rounded-2xl">
                    <Text className="text-xs text-indigo-100 mb-1">Today's Earnings</Text>
                    <Text className="text-2xl font-bold text-white">
                      ₹{todayStats.earnings}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Active Orders */}
              {activeOrders.data && activeOrders.data.length > 0 ? (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-white">
                      Active Orders ({activeOrders.data.length})
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

                  {activeOrders.data.map((order, idx) => (
                    <DeliveryActiveOrderCard
                      key={order.id}
                      order={order}
                      idx={idx}
                      handleMarkPickedUp={handleMarkPickedUpPress}
                      handleStartDelivery={handleStartDelivery}
                    />
                  ))}
                </View>
              ) : (
                <View className="bg-white/10 border border-white/20 rounded-3xl p-8 mb-6">
                  <View className="items-center">
                    <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                      <Feather name="inbox" size={40} color="white" />
                    </View>
                    <Text className="text-white font-bold text-lg mb-2">No Active Orders</Text>
                    <Text className="text-indigo-100 text-sm text-center mb-4">
                      {isOnline
                        ? 'Browse available orders to get started'
                        : 'Go online to see available orders'}
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

              {/* Today's Stats */}
              <View className="mb-6">
                <Text className="text-xl font-bold text-white mb-4">Today's Performance</Text>
                <View className="flex-row gap-3">
                  <StatCard
                    icon="package"
                    label="Orders"
                    value={todayStats.todayOrders}
                    bgColor="bg-indigo-500"
                  />
                  <StatCard
                    icon="navigation"
                    label="Distance"
                    value={`${todayStats.distanceKm} km`}
                    bgColor="bg-blue-500"
                  />
                  <StatCard
                    icon="dollar-sign"
                    label="Earned"
                    value={`₹${todayStats.earnings}`}
                    bgColor="bg-green-500"
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Available Orders Modal */}
      <Modal
        visible={showOrdersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrdersModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '85%' }}>
            <View className="p-6 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold text-gray-900">Available Orders</Text>
                <TouchableOpacity onPress={() => setShowOrdersModal(false)} activeOpacity={0.8}>
                  <Feather name="x" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-500">
                {availableOrders.data?.length || 0} orders waiting for delivery
              </Text>
            </View>

            {availableOrders.isLoading ? (
              <View className="p-8 items-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-gray-500 mt-4">Loading orders...</Text>
              </View>
            ) : availableOrders.data && availableOrders.data.length > 0 ? (
              <FlatList
                data={availableOrders.data}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
                    <View className="flex-row items-center justify-between mb-4">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-bold mb-1">ORDER ID</Text>
                        <Text className="text-md font-bold text-gray-900">#{item.order_number}</Text>
                      </View>
                      <View className="bg-indigo-50 px-4 py-2 rounded-full">
                        <Text className="text-indigo-600 font-bold">₹{item.payout}</Text>
                      </View>
                    </View>

                    <View className="mb-4">
                      {item.vendors.map((vendor, idx) => (
                        <View
                          key={vendor.id}
                          className="flex-row items-start p-3 bg-blue-50 rounded-lg mb-2"
                        >
                          <Feather name="shopping-bag" size={16} color="#3b82f6" />
                          <View className="flex-1 ml-2">
                            <Text className="text-xs text-blue-600 font-bold">
                              PICKUP {idx + 1}
                            </Text>
                            <Text className="font-semibold text-gray-900">{vendor.name}</Text>
                            <Text className="text-xs text-gray-600" numberOfLines={1}>
                              {vendor.address}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1">
                              {vendor.items.length} items
                            </Text>
                          </View>
                        </View>
                      ))}

                      <View className="flex-row items-start p-3 bg-green-50 rounded-lg">
                        <Feather name="map-pin" size={16} color="#22c55e" />
                        <View className="flex-1 ml-2">
                          <Text className="text-xs text-green-600 font-bold">DELIVERY</Text>
                          <Text className="font-semibold text-gray-900">
                            {item.customer.name}
                          </Text>
                          <Text className="text-xs text-gray-600" numberOfLines={1}>
                            {item.customer.address}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-2 mb-4">
                      <View className="flex-1 bg-gray-50 rounded-lg p-2">
                        <Text className="text-xs text-gray-500">Distance</Text>
                        <Text className="font-bold text-gray-900 text-sm">
                          {item.distance.toFixed(1)} km
                        </Text>
                      </View>
                      <View className="flex-1 bg-gray-50 rounded-lg p-2">
                        <Text className="text-xs text-gray-500">Total Items</Text>
                        <Text className="font-bold text-gray-900 text-sm">
                          {item.totalItems}
                        </Text>
                      </View>
                      <View className="flex-1 bg-gray-50 rounded-lg p-2">
                        <Text className="text-xs text-gray-500">Vendors</Text>
                        <Text className="font-bold text-gray-900 text-sm">
                          {item.vendors.length}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleAcceptOrderPress(item)}
                      className="bg-indigo-600 py-3 rounded-xl shadow-md"
                      activeOpacity={0.8}
                      disabled={acceptOrder.isPending}
                    >
                      {acceptOrder.isPending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-bold text-center">Accept Order</Text>
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

      {/* Accept Order Confirmation Modal */}
      <DeliveryConfirmationModal
        visible={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setSelectedOrderForAccept(null);
        }}
        onConfirm={handleConfirmAcceptOrder}
        title="Accept Order?"
        message={`Are you sure you want to accept order ${selectedOrderForAccept?.order_number}? You'll need to pick up items from ${selectedOrderForAccept?.vendors.length} vendor(s) and deliver to the customer.`}
        confirmText="Accept"
        cancelText="Cancel"
        isLoading={acceptOrder.isPending}
        icon="check-circle"
        iconColor="#6366f1"
      />

      {/* Mark Picked Up Confirmation Modal */}
      <DeliveryConfirmationModal
        visible={showPickupModal}
        onClose={() => {
          setShowPickupModal(false);
          setSelectedOrderForPickup(null);
        }}
        onConfirm={handleConfirmMarkPickedUp}
        title="Mark as Picked Up?"
        message={`Confirm that you have collected all items from the vendor(s). This will change the order status to "Out for Delivery".`}
        confirmText="Confirm Pickup"
        cancelText="Cancel"
        isLoading={markPickedUp.isPending}
        icon="package"
        iconColor="#f97316"
      />

      {/* OTP Verification Modal */}
      <DeliveryOTPVerificationModal
        showOtpModal={showOtpModal}
        setShowOtpModal={setShowOtpModal}
        selectedOrderForOtp={selectedOrderForOtp}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        handleVerifyOtp={handleVerifyOtp}
      />
    </SafeAreaView>
  );
};

/* ---------------- STAT CARD COMPONENT ---------------- */

const StatCard = ({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: any;
  bgColor: string;
}) => (
  <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
    <View
      className={`w-10 h-10 ${bgColor} rounded-xl items-center justify-center mb-3 shadow-md`}
    >
      <Feather name={icon} size={20} color="white" />
    </View>
    <Text className="text-xs text-gray-500 mb-1 font-semibold">{label}</Text>
    <Text className="text-xl font-bold text-gray-900">{value}</Text>
  </View>
);

export default DeliveryPartnerHome;