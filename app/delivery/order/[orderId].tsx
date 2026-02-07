import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import {
  useDeliveryOrderDetail,
  useMarkOrderPickedUp,
  useCompleteDelivery,
  DeliveryOrder,
} from '@/hooks/queries/useDeliveryOrders';

/* ---------------- MAIN COMPONENT ---------------- */
const OrderDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  
  const store = useDeliveryStore();
  const isVerified = store.adminVerificationStatus === 'approved' && store.isKycCompleted;

  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [localItemStates, setLocalItemStates] = useState<Record<string, boolean>>({});

  // Queries
  const { 
    data: order, 
    isLoading, 
    error,
    refetch,
  } = useDeliveryOrderDetail(orderId);

  // Mutations
  const markPickedUpMutation = useMarkOrderPickedUp();
  const completeDeliveryMutation = useCompleteDelivery();

  const handleToggleItemCollection = (vendorId: string, itemId: string) => {
    if (!isVerified) return;
    
    const key = `${vendorId}-${itemId}`;
    setLocalItemStates(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleMarkVendorCollected = async () => {
    if (!isVerified || !order) return;

    try {
      await markPickedUpMutation.mutateAsync(order.id);
      Alert.alert('Success', 'Order marked as picked up!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark order as picked up');
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

  const handleVerifyOtp = async () => {
    if (!isVerified || !order) return;

    try {
      await completeDeliveryMutation.mutateAsync({
        orderId: order.id,
        otp: otpInput,
      });
      
      setShowOtpModal(false);
      setOtpInput('');
      
      Alert.alert(
        'Success!', 
        'Order delivered successfully! Great job! 🎉',
        [{ text: 'OK', onPress: () => router.push('/delivery/orders') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5]">
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
            <Feather name="alert-circle" size={40} color="white" />
          </View>
          <Text className="text-white text-xl font-bold mb-2">Order Not Found</Text>
          <Text className="text-indigo-100 text-center mb-6">
            The order you're looking for doesn't exist
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/delivery/orders')}
            className="bg-white px-6 py-3 rounded-full"
            activeOpacity={0.8}
          >
            <Text className="text-[#4f46e5] font-bold">Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const vendorsCollected = order.vendors.filter(v => v.collected).length;
  const totalVendors = order.vendors.length;
  const allVendorsCollected = vendorsCollected === totalVendors;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_pickup': return 'bg-yellow-500';
      case 'out_for_delivery': return 'bg-orange-500';
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

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.push('/delivery/orders')}
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold flex-1">Order Details</Text>
        <View className={`px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
          <Text className="text-white text-xs font-bold">
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
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
                  ORDER ID
                </Text>
                <Text className="text-xl font-bold text-gray-900">#{order.order_number}</Text>
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
                <Text className="font-bold text-gray-900">{totalVendors}</Text>
              </View>
            </View>
          </View>

          {/* Progress Indicator */}
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-900 mb-4">Order Progress</Text>
            
            <View className="flex-row items-center justify-between mb-2">
              {/* Pickup */}
              <View className="items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                  vendorsCollected > 0 ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {vendorsCollected === totalVendors ? (
                    <Feather name="check" size={24} color="white" />
                  ) : (
                    <Feather name="shopping-bag" size={24} color="white" />
                  )}
                </View>
                <Text className="text-xs font-semibold text-gray-700 text-center">Pickup</Text>
                <Text className="text-xs text-gray-500">{vendorsCollected}/{totalVendors}</Text>
              </View>

              {/* Line */}
              <View className={`h-1 flex-1 mx-2 ${allVendorsCollected ? 'bg-green-500' : 'bg-gray-200'}`} />

              {/* Delivery */}
              <View className="items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                  order.status === 'delivered' ? 'bg-green-500' : 
                  allVendorsCollected ? 'bg-orange-500' : 'bg-gray-300'
                }`}>
                  {order.status === 'delivered' ? (
                    <Feather name="check" size={24} color="white" />
                  ) : (
                    <Feather name="map-pin" size={24} color="white" />
                  )}
                </View>
                <Text className="text-xs font-semibold text-gray-700 text-center">Delivery</Text>
                <Text className="text-xs text-gray-500">
                  {order.status === 'delivered' ? 'Done' : 'Pending'}
                </Text>
              </View>

              {/* Line */}
              <View className={`h-1 flex-1 mx-2 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-200'}`} />

              {/* Completed */}
              <View className="items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                  order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <Feather name="check-circle" size={24} color="white" />
                </View>
                <Text className="text-xs font-semibold text-gray-700 text-center">Completed</Text>
              </View>
            </View>
          </View>

          {/* Vendor Pickup Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xl font-bold text-white">
                Vendor Pickups
              </Text>
              <View className="bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {vendorsCollected} of {totalVendors} collected
                </Text>
              </View>
            </View>

            {order.vendors.map((vendor, idx) => {
              const isItemCollected = (itemId: string) => {
                const key = `${vendor.id}-${itemId}`;
                return localItemStates[key] !== undefined 
                  ? localItemStates[key] 
                  : vendor.items.find(i => i.id === itemId)?.collected || false;
              };

              const allItemsCollected = vendor.items.every(item => isItemCollected(item.id));

              return (
                <View key={vendor.id} className="bg-white rounded-3xl p-5 mb-3 shadow-lg">
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

                  {/* Expandable Items */}
                  <TouchableOpacity
                    onPress={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                    className="flex-row items-center justify-between py-2 border-t border-gray-100"
                    activeOpacity={0.8}
                    disabled={vendor.collected}
                  >
                    <Text className="text-sm font-semibold text-gray-700">
                      {vendor.collected ? 'All items collected' : 'View items to collect'}
                    </Text>
                    {!vendor.collected && (
                      <Feather 
                        name={expandedVendor === vendor.id ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color="#6b7280"
                      />
                    )}
                  </TouchableOpacity>

                  {expandedVendor === vendor.id && !vendor.collected && (
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
                            isItemCollected(item.id) ? 'bg-green-500' : 'bg-gray-200'
                          }`}>
                            {isItemCollected(item.id) && <Feather name="check" size={16} color="white" />}
                          </View>
                          <View className="flex-1">
                            <Text className={`font-semibold ${
                              isItemCollected(item.id) ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </Text>
                            <Text className="text-xs text-gray-500">{item.qty}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {!vendor.collected && order.status === 'ready_for_pickup' && (
                    <TouchableOpacity
                      onPress={handleMarkVendorCollected}
                      disabled={!isVerified || !allItemsCollected || markPickedUpMutation.isPending}
                      className={`mt-4 py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                        isVerified && allItemsCollected ? 'bg-[#4f46e5]' : 'bg-gray-300'
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

          {/* Customer Delivery Section */}
          {allVendorsCollected && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-white mb-3">
                Customer Delivery
              </Text>

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

                {order.status !== 'delivered' && (
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

                {order.status === 'delivered' && (
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