import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import { BlurView } from 'expo-blur';
import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import DeliveryConfirmationModal from '@/components/Deliveryconfirmationmodal';
import {
  useDeliveryOrderDetail,
  useAcceptDeliveryOrder,
  useMarkOrderPickedUp,
  useCompleteDelivery,
} from '@/hooks/queries/useDeliveryOrders';

/* ---------------- MAIN COMPONENT ---------------- */
const OrderDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  
  const store = useDeliveryStore();
  const isVerified = store.adminVerificationStatus === 'approved' && store.isKycCompleted;

  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  
  // Confirmation Modal States
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);
  
  const [localItemStates, setLocalItemStates] = useState<Record<string, boolean>>({});

  // Queries
  const { 
    data: order, 
    isLoading, 
    error,
    refetch,
  } = useDeliveryOrderDetail(orderId);

  // Mutations
  const acceptOrderMutation = useAcceptDeliveryOrder();
  const markPickedUpMutation = useMarkOrderPickedUp();
  const completeDeliveryMutation = useCompleteDelivery();

  // Calculate vendor collection progress
  const vendorProgress = useMemo(() => {
    if (!order) return { collected: 0, total: 0, allCollected: false };
    const collected = order.vendors.filter(v => v.collected).length;
    const total = order.vendors.length;
    return { collected, total, allCollected: collected === total };
  }, [order]);

  const handleToggleItemCollection = (vendorId: string, itemId: string) => {
    if (!isVerified) return;
    
    const key = `${vendorId}-${itemId}`;
    setLocalItemStates(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isItemCollected = (vendorId: string, itemId: string) => {
    if (!order) return false;
    const key = `${vendorId}-${itemId}`;
    const vendor = order.vendors.find(v => v.id === vendorId);
    return localItemStates[key] !== undefined 
      ? localItemStates[key] 
      : vendor?.items.find(i => i.id === itemId)?.collected || false;
  };

  const areAllItemsCollected = (vendorId: string) => {
    if (!order) return false;
    const vendor = order.vendors.find(v => v.id === vendorId);
    if (!vendor) return false;
    return vendor.items.every(item => isItemCollected(vendorId, item.id));
  };

  // Accept Order Handler
  const handleAcceptOrder = () => {
    if (!isVerified || !order) return;
    setShowAcceptModal(true);
  };

  const handleConfirmAcceptOrder = async () => {
    if (!isVerified || !order) return;

    try {
      await acceptOrderMutation.mutateAsync(order.id);
      setShowAcceptModal(false);
      Toast.show({
        type: 'success',
        text1: 'Order Accepted! 🎉',
        text2: 'You can now start picking up items from vendors.',
        position: 'top',
      });
      refetch();
    } catch (error: any) {
      setShowAcceptModal(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to accept order.',
        position: 'top',
      });
    }
  };

  // Mark Vendor Picked Up Handler
  const handleMarkVendorCollectedPress = (vendorId: string) => {
    if (!isVerified || !order) return;
    if (!areAllItemsCollected(vendorId)) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete',
        text2: 'Please collect all items before marking as picked up.',
        position: 'top',
      });
      return;
    }
    setCurrentVendorId(vendorId);
    setShowPickupModal(true);
  };

  const handleConfirmMarkPickedUp = async () => {
    if (!isVerified || !order) return;

    try {
      await markPickedUpMutation.mutateAsync(order.id);
      setShowPickupModal(false);
      setCurrentVendorId(null);
      setLocalItemStates({});
      Toast.show({
        type: 'success',
        text1: 'Items Picked Up! 📦',
        text2: 'All items collected! You can now deliver to the customer.',
        position: 'top',
      });
      refetch();
    } catch (error: any) {
      setShowPickupModal(false);
      console.log(error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to mark order as picked up.',
        position: 'top',
      });
    }
  };

  const handleNavigateToCustomer = () => {
    if (!order) return;
    const { lat, lng } = order.customer;
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  const handleNavigateToVendor = (vendorId: string) => {
    if (!order) return;
    const vendor = order.vendors.find(v => v.id === vendorId);
    if (vendor?.lat && vendor?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${vendor.lat},${vendor.lng}`;
      Linking.openURL(url);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isVerified || !order) return;

    try {
      await completeDeliveryMutation.mutateAsync({
        orderId: order.id,
        otp: otpInput,
      });
      
      setShowOtpModal(false);
      setOtpInput('');
      
      Toast.show({
        type: 'success',
        text1: 'Delivery Complete! 🎉',
        text2: `Great job! You've earned ₹${order.payout}`,
        position: 'top',
      });
      router.replace('/delivery/orders');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Invalid OTP. Please try again.',
        position: 'top',
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-600">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-600">
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
            <Feather name="alert-circle" size={40} color="white" />
          </View>
          <Text className="text-white text-xl font-bold mb-2">Order Not Found</Text>
          <Text className="text-indigo-100 text-center mb-6">
            This order doesn't exist or has been removed
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/delivery/orders')}
            className="bg-white px-6 py-3 rounded-full"
            activeOpacity={0.8}
          >
            <Text className="text-indigo-600 font-bold">Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_pickup': return 'bg-yellow-500';
      case 'out_for_delivery': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };
  
  // Determine current stage
  const isUnassigned = !order.delivery_boy_id;
  const isAssigned = !!order.delivery_boy_id && !order.picked_up_at;
  const isPickedUp = order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';
   
  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.replace('/delivery/orders')}
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">Order #{order.order_number}</Text>
        </View>
        <View className={`px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
          <Text className="text-white text-xs font-bold">
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          {/* Verification Gate */}
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
                  <Text className="text-sm text-gray-600 leading-5">
                    Complete KYC and admin verification to proceed with orders
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Order Summary Card */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xs text-gray-500 font-bold tracking-wider mb-1">
                  ORDER SUMMARY
                </Text>
                <Text className="text-sm font-bold text-gray-900">#{order.order_number}</Text>
              </View>
              <View className="bg-green-50 px-4 py-2 rounded-full">
                <Text className="text-green-600 font-bold text-lg">₹{order.payout}</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-500 mb-1">Distance</Text>
                <Text className="font-bold text-gray-900">{order.distance.toFixed(1)} km</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-500 mb-1">Total Items</Text>
                <Text className="font-bold text-gray-900">{order.totalItems}</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-500 mb-1">Vendors</Text>
                <Text className="font-bold text-gray-900">{order.vendors.length}</Text>
              </View>
            </View>
          </View>

          {/* STAGE 1: Accept Order Button - Show only if unassigned */}
          {isUnassigned && (
            <TouchableOpacity
              onPress={handleAcceptOrder}
              disabled={!isVerified || acceptOrderMutation.isPending}
              className={`rounded-3xl p-5 mb-4 shadow-lg ${
                isVerified ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
              activeOpacity={0.8}
            >
              {acceptOrderMutation.isPending ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-bold ml-3">Accepting...</Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Feather name="check-circle" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Accept This Order</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Progress Indicator - Show after accepting */}
          {!isUnassigned && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-900 mb-4">Delivery Progress</Text>
              
              <View className="flex-row items-center justify-between mb-2">
                {/* Pickup */}
                <View className="items-center flex-1">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                    isPickedUp || isDelivered ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {isPickedUp || isDelivered ? (
                      <Feather name="check" size={24} color="white" />
                    ) : (
                      <Feather name="shopping-bag" size={24} color="white" />
                    )}
                  </View>
                  <Text className="text-xs font-semibold text-gray-700 text-center">Pickup</Text>
                  <Text className="text-xs text-gray-500">
                    {isPickedUp || isDelivered ? 'Done' : 'Pending'}
                  </Text>
                </View>

                {/* Line */}
                <View className={`h-1 flex-1 mx-2 ${isPickedUp || isDelivered ? 'bg-green-500' : 'bg-gray-200'}`} />

                {/* Delivery */}
                <View className="items-center flex-1">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                    isDelivered ? 'bg-green-500' : 
                    isPickedUp ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    {isDelivered ? (
                      <Feather name="check" size={24} color="white" />
                    ) : (
                      <Feather name="truck" size={24} color="white" />
                    )}
                  </View>
                  <Text className="text-xs font-semibold text-gray-700 text-center">Delivery</Text>
                  <Text className="text-xs text-gray-500">
                    {isDelivered ? 'Done' : 'Pending'}
                  </Text>
                </View>

                {/* Line */}
                <View className={`h-1 flex-1 mx-2 ${isDelivered ? 'bg-green-500' : 'bg-gray-200'}`} />

                {/* Completed */}
                <View className="items-center flex-1">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                    isDelivered ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <Feather name="check-circle" size={24} color="white" />
                  </View>
                  <Text className="text-xs font-semibold text-gray-700 text-center">Completed</Text>
                </View>
              </View>
            </View>
          )}

          {/* STAGE 2: Vendor Pickup Section - Show after accepting */}
          {!isUnassigned && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-bold text-white">Vendor Pickups</Text>
                <View className="bg-white/20 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {isPickedUp || isDelivered ? 'Collected' : 'In Progress'}
                  </Text>
                </View>
              </View>

              {order.vendors.map((vendor, idx) => {
                const allItemsCollected = areAllItemsCollected(vendor.id);
                return (
                  <View key={vendor.id} className="bg-white rounded-3xl p-5 mb-3 shadow-lg">
                    {/* Vendor Header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Feather name="shopping-bag" size={20} color="#4f46e5" />
                          <Text className="text-lg font-bold text-gray-900 ml-2">
                            {vendor.name}
                          </Text>
                        </View>
                        <Text className="text-sm text-gray-600 mb-1">{vendor.address}</Text>
                        <Text className="text-xs text-gray-500">{vendor.items.length} items</Text>
                      </View>
                      <View className={`px-3 py-1.5 rounded-full ${
                        vendor.collected ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                        <Text className="text-white text-xs font-bold">
                          {vendor.collected ? 'Collected' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {/* Navigate Button */}
                    {!vendor.collected && isAssigned && (
                      <TouchableOpacity
                        onPress={() => handleNavigateToVendor(vendor.id)}
                        className="bg-blue-50 border border-blue-200 py-3 rounded-xl mb-3 flex-row items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <Feather name="navigation" size={18} color="#3b82f6" />
                        <Text className="text-blue-600 font-bold ml-2">Navigate to Vendor</Text>
                      </TouchableOpacity>
                    )}

                    {/* Items List */}
                    <TouchableOpacity
                      onPress={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                      className="flex-row items-center justify-between py-2 border-t border-gray-100"
                      activeOpacity={0.8}
                      disabled={vendor.collected || isUnassigned}
                    >
                      <Text className="text-sm font-semibold text-gray-700">
                        {vendor.collected
                          ? 'All items collected'
                          : isUnassigned
                          ? 'Items to collect'
                          : 'View items to collect'}
                      </Text>
                      {!vendor.collected && !isUnassigned && (
                        <Feather 
                          name={expandedVendor === vendor.id ? 'chevron-up' : 'chevron-down'} 
                          size={20} 
                          color="#6b7280"
                        />
                      )}
                    </TouchableOpacity>

                    {expandedVendor === vendor.id && !vendor.collected && !isUnassigned && (
                      <View className="mt-3 space-y-2">
                        {vendor.items.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => handleToggleItemCollection(vendor.id, item.id)}
                            className="flex-row items-center py-2"
                            activeOpacity={0.7}
                            disabled={!isVerified}
                          >
                            <View className={`w-6 h-6 rounded items-center justify-center mr-3 ${
                              isItemCollected(vendor.id, item.id) ? 'bg-green-500' : 'bg-gray-200'
                            }`}>
                              {isItemCollected(vendor.id, item.id) && (
                                <Feather name="check" size={16} color="white" />
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className={`font-semibold ${
                                isItemCollected(vendor.id, item.id)
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-900'
                              }`}>
                                {item.name}
                              </Text>
                              <Text className="text-xs text-gray-500">{item.qty}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Mark as Picked Up Button */}
                    {!vendor.collected && isAssigned && (
                      <TouchableOpacity
                        onPress={() => handleMarkVendorCollectedPress(vendor.id)}
                        disabled={!isVerified || !allItemsCollected || markPickedUpMutation.isPending}
                        className={`mt-4 py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                          isVerified && allItemsCollected ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                        activeOpacity={0.8}
                      >
                        {markPickedUpMutation.isPending ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Feather name="check-circle" size={18} color="white" />
                            <Text className="text-white font-bold">Mark as Picked Up</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* STAGE 3: Customer Delivery Section */}
          {(isPickedUp || isDelivered) && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-white mb-3">Customer Delivery</Text>

              <View className="bg-white rounded-3xl p-5 shadow-lg">
                <View className="flex-row items-start mb-4">
                  <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mr-4">
                    <Feather name="home" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-green-600 font-bold mb-1">DELIVER TO</Text>
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {order.customer.name}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2">{order.customer.address}</Text>
                    <View className="flex-row items-center">
                      <Feather name="phone" size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-500 ml-1">{order.customer.phone}</Text>
                    </View>
                  </View>
                </View>

                {!isDelivered && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={handleNavigateToCustomer}
                      className="flex-1 bg-blue-500 py-3 rounded-xl flex-row items-center justify-center gap-2"
                      activeOpacity={0.8}
                    >
                      <Feather name="navigation" size={18} color="white" />
                      <Text className="text-white font-bold">Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowOtpModal(true)}
                      disabled={!isVerified || completeDeliveryMutation.isPending}
                      className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                        isVerified ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      activeOpacity={0.8}
                    >
                      {completeDeliveryMutation.isPending ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Feather name="lock" size={18} color="white" />
                          <Text className="text-white font-bold">Enter OTP</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {isDelivered && (
                  <View className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <View className="flex-row items-center justify-center">
                      <Feather name="check-circle" size={20} color="#22c55e" />
                      <Text className="text-green-700 font-bold ml-2">
                        Order Delivered Successfully!
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Blur Background for Modals */}
      {(showOtpModal || showPickupModal || showAcceptModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Accept Order Confirmation Modal */}
      <DeliveryConfirmationModal
        visible={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={handleConfirmAcceptOrder}
        title="Accept This Order?"
        message={`Ready to start? You'll pick up items from ${order.vendors.length} vendor(s) and deliver to ${order.customer.name}. Your payout will be ₹${order.payout}.`}
        confirmText="Yes, Accept Order"
        cancelText="Not Now"
        isLoading={acceptOrderMutation.isPending}
        icon="check-circle"
        iconColor="#6366f1"
      />

      {/* Mark Picked Up Confirmation Modal */}
      <DeliveryConfirmationModal
        visible={showPickupModal}
        onClose={() => {
          setShowPickupModal(false);
          setCurrentVendorId(null);
        }}
        onConfirm={handleConfirmMarkPickedUp}
        title="Confirm Pickup?"
        message={`Please confirm that you have collected all items from ${
          currentVendorId ? order.vendors.find(v => v.id === currentVendorId)?.name : 'this vendor'
        }. This will update the order status to "Out for Delivery".`}
        confirmText="Yes, Picked Up"
        cancelText="Cancel"
        isLoading={markPickedUpMutation.isPending}
        icon="package"
        iconColor="#f97316"
      />

      {/* OTP Verification Modal */}
      <DeliveryOTPVerificationModal
        showOtpModal={showOtpModal}
        setShowOtpModal={setShowOtpModal}
        selectedOrderForOtp={order}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        handleVerifyOtp={handleVerifyOtp}
      />
    </SafeAreaView>
  );
};

export default OrderDetailScreen;