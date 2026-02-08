import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import DeliveryConfirmationModal from '@/components/Deliveryconfirmationmodal';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  useAvailableDeliveryOrders,
  useActiveDeliveryOrders,
  useCompletedDeliveryOrders,
  useDeliveryBoyStats,
  useAcceptDeliveryOrder,
  useMarkOrderPickedUp,
  useCompleteDelivery,
} from '@/hooks/queries/useDeliveryOrders';
import { DeliveryOrder } from '@/types/delivery-orders.types';

/* ---------------- MAIN COMPONENT ---------------- */
const DeliveryOrderScreen = () => {
  
  const router = useRouter();
  const store = useDeliveryStore();
  const { partner,setPartner, isKycCompleted,setKycCompleted,setAdminVerificationStatus, adminVerificationStatus ,toggleOnline} = store;
  const isVerified = adminVerificationStatus === 'approved' && isKycCompleted;

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState<DeliveryOrder | null>(null);
  const [otpInput, setOtpInput] = useState('');

  // Accept Order Confirmation Modal State
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOrderForAccept, setSelectedOrderForAccept] = useState<DeliveryOrder | null>(null);

  // Pickup Confirmation Modal State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState<DeliveryOrder | null>(null);

  // Queries
  const { 
    data: availableOrders = [], 
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
    isRefetching: refetchingAvailable,
  } = useAvailableDeliveryOrders();


  
  const { 
    data: activeOrders = [], 
    isLoading: loadingActive,
    refetch: refetchActive,
    isRefetching: refetchingActive,
  } = useActiveDeliveryOrders();
  
  const { 
    data: completedOrders = [], 
    isLoading: loadingCompleted,
    refetch: refetchCompleted,
    isRefetching: refetchingCompleted,
  } = useCompletedDeliveryOrders();
  
  const { data: stats } = useDeliveryBoyStats();

  // Mutations
  const acceptOrderMutation = useAcceptDeliveryOrder();
  const markPickedUpMutation = useMarkOrderPickedUp();
  const completeDeliveryMutation = useCompleteDelivery();

  const handleRefresh = () => {
    if (activeTab === 'available') refetchAvailable();
    else if (activeTab === 'active') refetchActive();
    else refetchCompleted();
  };

  // Accept Order Flow
  const handleAcceptOrderPress = (order: DeliveryOrder) => {
    setSelectedOrderForAccept(order);
    setShowAcceptModal(true);
  };

  const handleConfirmAcceptOrder = async () => {
    if (!selectedOrderForAccept) return;

    try {
      await acceptOrderMutation.mutateAsync(selectedOrderForAccept.id);
      setShowAcceptModal(false);
      setSelectedOrderForAccept(null);
      Alert.alert('Success', 'Order accepted successfully! 🎉');
      setActiveTab('active');
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
      await markPickedUpMutation.mutateAsync(selectedOrderForPickup.id);
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
      await completeDeliveryMutation.mutateAsync({
        orderId: selectedOrderForOtp.id,
        otp: otpInput,
      });
      
      setShowOtpModal(false);
      setOtpInput('');
      setSelectedOrderForOtp(null);
      
      Alert.alert(
        'Success!',
        'Order delivered successfully! 🎉',
        [{ text: 'OK', onPress: () => setActiveTab('completed') }]
      );
    } catch (error: any) {
      console.log(error);
      
      Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleNavigate = (order: DeliveryOrder) => {
    const { lat, lng } = order.customer;
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const getOrdersForTab = () => {
    switch (activeTab) {
      case 'available':
        return availableOrders;
      case 'active':
        return activeOrders;
      case 'completed':
        return completedOrders;
      default:
        return [];
    }
  };

  const getCollectedVendorsCount = (order: DeliveryOrder) => {
    return order.vendors.filter(v => v.collected).length;
  };

  const isLoading = loadingAvailable || loadingActive || loadingCompleted;
  const isRefreshing = refetchingAvailable || refetchingActive || refetchingCompleted;
  
  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-white mb-4">Orders</Text>

        {/* Stats Row */}
        {isVerified && stats && (
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Total Orders</Text>
              <Text className="text-xl font-bold text-white">{stats.totalOrders}</Text>
            </View>
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Distance</Text>
              <Text className="text-xl font-bold text-white">{stats.totalDistance} km</Text>
            </View>
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Earnings</Text>
              <Text className="text-xl font-bold text-white">₹{stats.totalEarnings}</Text>
            </View>
          </View>
        )}

        {/* Tab Bar */}
        <View className="bg-indigo-500 rounded-2xl p-1 flex-row">
          <TouchableOpacity
            onPress={() => setActiveTab('available')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'available' ? 'bg-white' : 'bg-transparent'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-center font-bold text-sm ${activeTab === 'available' ? 'text-indigo-600' : 'text-white/70'}`}>
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'active' ? 'bg-white' : 'bg-transparent'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-center font-bold text-sm ${activeTab === 'active' ? 'text-indigo-600' : 'text-white/70'}`}>
              Active ({activeOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'completed' ? 'bg-white' : 'bg-transparent'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-center font-bold text-sm ${activeTab === 'completed' ? 'text-indigo-600' : 'text-white/70'}`}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Verification Gate */}
      {!isVerified ? (
        <View className="px-4 pt-4">
          <View className="bg-orange-50 border-l-4 border-orange-400 p-5 rounded-2xl flex-row gap-4 shadow-sm">
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
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading orders...</Text>
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
          {getOrdersForTab().length === 0 ? (
            <View className="bg-white/10 border border-white/20 rounded-3xl p-8 items-center mt-8">
              <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
                <Feather name="inbox" size={40} color="white" />
              </View>
              <Text className="text-white font-bold text-lg mb-2">No Orders</Text>
              <Text className="text-indigo-100 text-sm text-center">
                {activeTab === 'available' && 'No orders available at the moment'}
                {activeTab === 'active' && 'You have no active orders'}
                {activeTab === 'completed' && 'No completed orders yet'}
              </Text>
            </View>
          ) : (
            getOrdersForTab().map((order, idx) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/delivery/order/${order.id}`)}
                activeOpacity={0.9}
              >
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                  {/* Order Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 font-bold tracking-wider mb-1">
                        ORDER #{idx + 1}
                      </Text>
                      <Text className="text-lg font-bold text-gray-900">{order.order_number}</Text>
                    </View>
                    <View className={`px-4 py-2 rounded-full ${
                      order.status === 'ready_for_pickup' ? 'bg-yellow-100' :
                      order.status === 'out_for_delivery' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                      <Text className={`font-bold text-sm ${
                        order.status === 'ready_for_pickup' ? 'text-yellow-700' :
                        order.status === 'out_for_delivery' ? 'text-blue-700' :
                        'text-green-700'
                      }`}>
                        {order.status === 'ready_for_pickup' ? 'Ready' :
                         order.status === 'out_for_delivery' ? 'Delivering' :
                         'Completed'}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar for Active Orders */}
                  {order.status !== 'delivered' && activeTab === 'active' && (
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-semibold text-gray-600">
                          Pickup Progress
                        </Text>
                        <Text className="text-xs font-bold text-indigo-600">
                          {getCollectedVendorsCount(order)}/{order.vendors.length} vendors
                        </Text>
                      </View>
                      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${(getCollectedVendorsCount(order) / order.vendors.length) * 100}%` }}
                        />
                      </View>
                    </View>
                  )}

                  {/* Vendors Section */}
                  <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                    <View className="flex-row items-center">
                      <Feather name="shopping-bag" size={16} color="#374151" />
                      <Text className="text-sm font-bold text-gray-700 ml-2">
                        {order.vendors.length} Vendor{order.vendors.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {order.totalItems} items
                    </Text>
                  </View>

                  {/* Customer Delivery */}
                  <View className="flex-row p-4 bg-green-50 rounded-2xl border-2 border-green-200 mb-4">
                    <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center shadow-md mr-3">
                      <Feather name="map-pin" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-green-700 font-bold mb-1">DELIVER TO</Text>
                      <Text className="font-bold text-gray-900">{order.customer.name}</Text>
                      <Text className="text-xs text-gray-600 mb-1" numberOfLines={2}>{order.customer.address}</Text>
                      <Text className="text-xs text-gray-500">📞 {order.customer.phone}</Text>
                    </View>
                  </View>

                  {/* Order Info */}
                  <View className="flex-row gap-2 mb-4">
                    <View className="flex-1 bg-gray-50 rounded-xl p-3">
                      <Text className="text-xs text-gray-500 mb-1">Distance</Text>
                      <Text className="font-bold text-gray-900">{order.distance.toFixed(1)} km</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 rounded-xl p-3">
                      <Text className="text-xs text-gray-500 mb-1">Items</Text>
                      <Text className="font-bold text-gray-900">{order.totalItems}</Text>
                    </View>
                    <View className="flex-1 bg-green-50 rounded-xl p-3">
                      <Text className="text-xs text-green-600 mb-1">Payout</Text>
                      <Text className="font-bold text-green-600">₹{order.payout}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {activeTab === 'available' && (
                    <TouchableOpacity
                      onPress={() => handleAcceptOrderPress(order)}
                      className="bg-indigo-600 py-3 rounded-xl shadow-md flex-row items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <Feather name="check-circle" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Accept Order</Text>
                    </TouchableOpacity>
                  )}

                  {activeTab === 'active' && (
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => handleNavigate(order)}
                        className="flex-1 bg-blue-500 py-3 rounded-xl shadow-md flex-row items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <Feather name="navigation" size={18} color="white" />
                        <Text className="text-white font-bold ml-2">Navigate</Text>
                      </TouchableOpacity>
                      
                      {order.status === 'ready_for_pickup' ? (
                        <TouchableOpacity
                          onPress={() => handleMarkPickedUpPress(order)}
                          className="flex-1 bg-orange-500 py-3 rounded-xl shadow-md flex-row items-center justify-center"
                          activeOpacity={0.8}
                        >
                          <Feather name="package" size={18} color="white" />
                          <Text className="text-white font-bold ml-2">Picked Up</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleStartDelivery(order)}
                          className="flex-1 bg-green-500 py-3 rounded-xl shadow-md flex-row items-center justify-center"
                          activeOpacity={0.8}
                        >
                          <Feather name="check-circle" size={18} color="white" />
                          <Text className="text-white font-bold ml-2">Deliver</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {activeTab === 'completed' && (
                    <View className="bg-green-100 py-3 rounded-xl flex-row items-center justify-center">
                      <Feather name="check-circle" size={18} color="#16a34a" />
                      <Text className="text-green-700 font-bold ml-2">Delivered Successfully</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
          <View className="h-6" />
        </ScrollView>
      )}

      {/* Blur Background for Modals */}
      {(showOtpModal || showAcceptModal || showPickupModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

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
        isLoading={acceptOrderMutation.isPending}
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
        message={`Confirm that you have collected all items from ${selectedOrderForPickup?.vendors[0]?.name}. This will change the order status to "Out for Delivery".`}
        confirmText="Confirm Pickup"
        cancelText="Cancel"
        isLoading={markPickedUpMutation.isPending}
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

export default DeliveryOrderScreen;