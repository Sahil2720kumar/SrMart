import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Order, useDeliveryStore } from '@/store/useDeliveryStore';
import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';

/* ---------------- MOCK ORDER DATA ---------------- */
const mockOrders:Order = [
  {
    id: 'ORD-2024-001234',
    status: 'pickup_in_progress',
    customer: { 
      name: 'Rajesh Kumar', 
      address: 'B-204, Green Valley Apartments, Sector 18, Noida', 
      phone: '+91 98765 43210',
      lat: 28.5355,
      lng: 77.3910
    },
    vendors: [
      { 
        id: 'V1',
        name: 'Fresh Grocery Store', 
        address: 'Shop 12, Sector 21 Market, Noida',
        items: [
          { id: 'I1', name: 'Tomatoes', qty: '1 kg', collected: false },
          { id: 'I2', name: 'Onions', qty: '2 kg', collected: false },
          { id: 'I3', name: 'Potatoes', qty: '1 kg', collected: false }
        ],
        collected: false
      },
      { 
        id: 'V2',
        name: 'Daily Needs Mart', 
        address: 'Shop 45, Sector 21 Market, Noida',
        items: [
          { id: 'I4', name: 'Milk', qty: '2 L', collected: false },
          { id: 'I5', name: 'Bread', qty: '2 pcs', collected: false },
          { id: 'I6', name: 'Eggs', qty: '12 pcs', collected: false }
        ],
        collected: false
      },
      { 
        id: 'V3',
        name: 'Metro Cash & Carry', 
        address: 'Shop 78, Sector 18 Market, Noida',
        items: [
          { id: 'I7', name: 'Rice', qty: '5 kg', collected: false },
          { id: 'I8', name: 'Dal', qty: '2 kg', collected: false }
        ],
        collected: false
      }
    ],
    payout: 125,
    distance: 5.2,
    totalItems: 8,
    deliveryOtp: '8429'
  }
]

/* ---------------- MAIN COMPONENT ---------------- */
const OrderDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId || 'ORD-2024-001234';
  
  const store = useDeliveryStore();
  const isVerified = store.adminVerificationStatus === 'approved' && store.isKycCompleted;

  const [order, setOrder] = useState(mockOrders[0]);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  useEffect(() => {
    if (!order) {
      Alert.alert('Error', 'Order not found');
    }
  }, [order]);

  if (!order) {
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

  const handleToggleItemCollection = (vendorId, itemId) => {
    if (!isVerified) return;
    
    setOrder(prev => ({
      ...prev,
      vendors: prev.vendors.map(vendor => {
        if (vendor.id === vendorId) {
          return {
            ...vendor,
            items: vendor.items.map(item =>
              item.id === itemId ? { ...item, collected: !item.collected } : item
            )
          };
        }
        return vendor;
      })
    }));
  };

  const handleMarkVendorCollected = (vendorId) => {
    if (!isVerified) return;

    const vendor = order.vendors.find(v => v.id === vendorId);
    const allItemsCollected = vendor.items.every(item => item.collected);

    if (!allItemsCollected) {
      Alert.alert('Incomplete', 'Please collect all items before marking vendor as collected');
      return;
    }

    setOrder(prev => {
      const updatedVendors = prev.vendors.map(v =>
        v.id === vendorId ? { ...v, collected: true } : v
      );
      const allVendorsCollected = updatedVendors.every(v => v.collected);
      
      return {
        ...prev,
        vendors: updatedVendors,
        status: allVendorsCollected ? 'out_for_delivery' : 'pickup_in_progress'
      };
    });

    Alert.alert('Success', `${vendor.name} marked as collected!`);
  };

  const handleNavigateToCustomer = () => {
    const { lat, lng } = order.customer;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const handleVerifyOtp = () => {
    if (!isVerified) return;

    if (otpInput === order.deliveryOtp) {
      setOrder(prev => ({ ...prev, status: 'completed' }));
      setShowOtpModal(false);
      setOtpInput('');
      Alert.alert(
        'Success!', 
        'Order delivered successfully! Great job! 🎉',
        [{ text: 'OK', onPress: () => router.push('/delivery/orders') }]
      );
    } else {
      Alert.alert('Invalid OTP', 'Please check and try again.');
    }
  };

  const vendorsCollected = order.vendors.filter(v => v.collected).length;
  const totalVendors = order.vendors.length;
  const allVendorsCollected = vendorsCollected === totalVendors;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pickup_in_progress': return 'bg-blue-500';
      case 'out_for_delivery': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pickup_in_progress': return 'Pickup in Progress';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'completed': return 'Completed';
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
                <Text className="text-xl font-bold text-gray-900">#{order.id}</Text>
              </View>
              <View className="bg-green-50 px-4 py-2 rounded-full">
                <Text className="text-green-600 font-bold text-lg">₹{order.payout}</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-500 mb-1">Distance</Text>
                <Text className="font-bold text-gray-900">{order.distance} km</Text>
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
                  vendorsCollected > 0 ? 'bg-green-500' : 'bg-blue-500'
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
                  order.status === 'completed' ? 'bg-green-500' : 
                  allVendorsCollected ? 'bg-orange-500' : 'bg-gray-300'
                }`}>
                  {order.status === 'completed' ? (
                    <Feather name="check" size={24} color="white" />
                  ) : (
                    <Feather name="map-pin" size={24} color="white" />
                  )}
                </View>
                <Text className="text-xs font-semibold text-gray-700 text-center">Delivery</Text>
                <Text className="text-xs text-gray-500">
                  {order.status === 'completed' ? 'Done' : 'Pending'}
                </Text>
              </View>

              {/* Line */}
              <View className={`h-1 flex-1 mx-2 ${order.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />

              {/* Completed */}
              <View className="items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                  order.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
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

            {order.vendors.map((vendor, idx) => (
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
                          item.collected ? 'bg-green-500' : 'bg-gray-200'
                        }`}>
                          {item.collected && <Feather name="check" size={16} color="white" />}
                        </View>
                        <View className="flex-1">
                          <Text className={`font-semibold ${
                            item.collected ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {item.name}
                          </Text>
                          <Text className="text-xs text-gray-500">{item.qty}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {!vendor.collected && (
                  <TouchableOpacity
                    onPress={() => handleMarkVendorCollected(vendor.id)}
                    disabled={!isVerified}
                    className={`mt-4 py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                      isVerified ? 'bg-[#4f46e5]' : 'bg-gray-300'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Feather name="check-circle" size={18} color="white" />
                    <Text className="text-white font-bold">Mark Vendor Collected</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
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

                {order.status !== 'completed' && (
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
                      disabled={!isVerified}
                      className={`flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2 ${
                        isVerified ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      activeOpacity={0.8}
                    >
                      <Feather name="lock" size={18} color="white" />
                      <Text className="text-white font-bold">Enter OTP</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'completed' && (
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
     {/* OTP Verification Modal */}
     <DeliveryOTPVerificationModal
        showOtpModal={showOtpModal}
        setShowOtpModal={setShowOtpModal}
        selectedOrderForOtp={mockOrders}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        handleVerifyOtp={handleVerifyOtp} />
    </SafeAreaView>
  );
};

export default OrderDetailScreen;