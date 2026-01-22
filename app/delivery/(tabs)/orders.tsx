import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import { Order, useDeliveryStore } from '@/store/useDeliveryStore';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ---------------- MOCK DATA ---------------- */
const mockAvailableOrders: Order[] = [
  {
    id: 'ORD-2024-001234',
    customer: { name: 'Rajesh Kumar', address: 'B-204, Green Valley Apartments, Sector 18, Noida', phone: '+91 98765 43210' },
    vendors: [
      { id: 'V1', name: 'Fresh Grocery Store', address: 'Shop 12, Sector 21 Market, Noida', items: [{ name: 'Tomatoes', qty: '1 kg', collected: false }, { name: 'Onions', qty: '2 kg', collected: false }, { name: 'Potatoes', qty: '1 kg', collected: false }], collected: false },
      { id: 'V2', name: 'Daily Needs Mart', address: 'Shop 45, Sector 21 Market, Noida', items: [{ name: 'Milk', qty: '2 L', collected: false }, { name: 'Bread', qty: '2 pcs', collected: false }, { name: 'Eggs', qty: '12 pcs', collected: false }], collected: false }
    ],
    payout: 125,
    distance: 5.2,
    totalItems: 6,
    deliveryOtp: '8429',
    status: 'available',
    currentStep: 'pickup'
  },
  {
    id: 'ORD-2024-001235',
    customer: { name: 'Priya Sharma', address: 'C-301, Royal Heights, Sector 22, Noida', phone: '+91 87654 32109' },
    vendors: [
      { id: 'V3', name: 'BigBasket Store', address: 'Ground Floor, Sec 15 Mall, Noida', items: [{ name: 'Rice', qty: '5 kg', collected: false }, { name: 'Dal', qty: '2 kg', collected: false }, { name: 'Cooking Oil', qty: '1 L', collected: false }], collected: false }
    ],
    payout: 95,
    distance: 3.1,
    totalItems: 3,
    deliveryOtp: '5612',
    status: 'available',
    currentStep: 'pickup'
  },
  {
    id: 'ORD-2024-001236',
    customer: { name: 'Amit Patel', address: 'A-101, Silver Oak, Sector 25, Noida', phone: '+91 99887 76655' },
    vendors: [
      { id: 'V4', name: 'Metro Cash & Carry', address: 'Sector 18, Noida', items: [{ name: 'Wheat Flour', qty: '10 kg', collected: false }, { name: 'Sugar', qty: '5 kg', collected: false }], collected: false }
    ],
    payout: 80,
    distance: 2.5,
    totalItems: 2,
    deliveryOtp: '3421',
    status: 'available',
    currentStep: 'pickup'
  }
];

const mockActiveOrders: Order[] = [
  {
    id: 'ORD-2024-001230',
    customer: { name: 'Sneha Reddy', address: 'D-505, Palm Grove, Sector 16, Noida', phone: '+91 98123 45678' },
    vendors: [
      { id: 'V5', name: 'Fresh Mart', address: 'Sector 12 Market, Noida', items: [{ name: 'Apples', qty: '2 kg', collected: true }, { name: 'Bananas', qty: '1 kg', collected: true }], collected: true },
      { id: 'V6', name: 'Dairy Corner', address: 'Sector 12 Market, Noida', items: [{ name: 'Paneer', qty: '500g', collected: false }], collected: false }
    ],
    payout: 110,
    distance: 4.0,
    totalItems: 3,
    deliveryOtp: '7834',
    status: 'in_progress',
    currentStep: 'pickup'
  }
];

const mockCompletedOrders: Order[] = [
  {
    id: 'ORD-2024-001225',
    customer: { name: 'Vikram Singh', address: 'E-202, Lotus Heights, Sector 14, Noida', phone: '+91 97654 32108' },
    vendors: [
      { id: 'V7', name: 'Grocery Hub', address: 'Sector 15, Noida', items: [{ name: 'Rice', qty: '5 kg', collected: true }, { name: 'Dal', qty: '2 kg', collected: true }], collected: true }
    ],
    payout: 90,
    distance: 3.5,
    totalItems: 2,
    deliveryOtp: '9876',
    status: 'completed',
    currentStep: 'delivery'
  },
  {
    id: 'ORD-2024-001220',
    customer: { name: 'Anita Desai', address: 'F-101, Green Park, Sector 10, Noida', phone: '+91 96543 21087' },
    vendors: [
      { id: 'V8', name: 'Super Bazaar', address: 'Sector 11, Noida', items: [{ name: 'Vegetables', qty: 'Mixed', collected: true }], collected: true }
    ],
    payout: 75,
    distance: 2.8,
    totalItems: 1,
    deliveryOtp: '4567',
    status: 'completed',
    currentStep: 'delivery'
  }
];

/* ---------------- MAIN COMPONENT ---------------- */
const DeliveryOrderScreen = () => {
  const store = useDeliveryStore();
  const { partner, isKycCompleted, adminVerificationStatus } = store;
  const isVerified = adminVerificationStatus === 'approved' && isKycCompleted;

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>(mockAvailableOrders);
  const [activeOrders, setActiveOrders] = useState<Order[]>(mockActiveOrders);
  const [completedOrders, setCompletedOrders] = useState<Order[]>(mockCompletedOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState('');

  // Statistics
  const stats = {
    totalOrders: activeOrders.length + completedOrders.length,
    totalDistance: [...activeOrders, ...completedOrders].reduce((sum, order) => sum + order.distance, 0),
    totalEarnings: completedOrders.reduce((sum, order) => sum + order.payout, 0)
  };

  const handleAcceptOrder = (order: Order) => {
    const orderWithStatus: Order = {
      ...order,
      status: 'in_progress',
      currentStep: 'pickup',
      vendors: order.vendors.map(v => ({ ...v, collected: false, items: v.items.map(i => ({ ...i, collected: false })) }))
    };
    setActiveOrders([...activeOrders, orderWithStatus]);
    setAvailableOrders(availableOrders.filter(o => o.id !== order.id));
    store.assignOrder(order.id);
    Alert.alert('Success', 'Order accepted successfully!');
  };

  const handleToggleItemCollection = (orderId: string, vendorId: string, itemIndex: number) => {
    setActiveOrders(activeOrders.map(order => {
      if (order.id === orderId) {
        const updatedVendors = order.vendors.map(vendor => {
          if (vendor.id === vendorId) {
            const updatedItems = vendor.items.map((item, idx) =>
              idx === itemIndex ? { ...item, collected: !item.collected } : item
            );
            const allItemsCollected = updatedItems.every(i => i.collected);
            return { ...vendor, items: updatedItems, collected: allItemsCollected };
          }
          return vendor;
        });
        const allVendorsCollected = updatedVendors.every(v => v.collected);
        return {
          ...order,
          vendors: updatedVendors,
          currentStep: allVendorsCollected ? 'delivery' : 'pickup'
        };
      }
      return order;
    }));
  };

  const handleStartDelivery = (order: Order) => {
    setSelectedOrderForOtp(order);
    setShowOtpModal(true);
    setOtpInput('');
  };

  const handleVerifyOtp = () => {
    if (selectedOrderForOtp && otpInput === selectedOrderForOtp.deliveryOtp) {
      const completedOrder = { ...selectedOrderForOtp, status: 'completed' as const };
      setCompletedOrders([completedOrder, ...completedOrders]);
      setActiveOrders(activeOrders.filter(o => o.id !== selectedOrderForOtp.id));
      store.clearOrder();
      setShowOtpModal(false);
      setOtpInput('');
      Alert.alert('Success', 'Order delivered successfully!');
    } else {
      Alert.alert('Invalid OTP', 'Please check the OTP and try again.');
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

  const getCollectedVendorsCount = (order: Order) => {
    return order.vendors.filter(v => v.collected).length;
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-white mb-4">Orders</Text>

        {/* Stats Row */}
        {isVerified && (
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Total Orders</Text>
              <Text className="text-xl font-bold text-white">{stats.totalOrders}</Text>
            </View>
            <View className="flex-1 bg-white/20 border border-white/30 px-3 py-2 rounded-xl">
              <Text className="text-xs text-indigo-100 mb-0.5">Distance</Text>
              <Text className="text-xl font-bold text-white">{stats.totalDistance.toFixed(1)} km</Text>
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
              Active
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
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
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
              <View key={order.id} className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                {/* Order Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 font-bold tracking-wider mb-1">
                      ORDER #{idx + 1}
                    </Text>
                    <Text className="text-lg font-bold text-gray-900">{order.id}</Text>
                  </View>
                  <View className={`px-4 py-2 rounded-full ${order.status === 'available' ? 'bg-yellow-100' :
                    order.status === 'in_progress' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                    <Text className={`font-bold text-sm ${order.status === 'available' ? 'text-yellow-700' :
                      order.status === 'in_progress' ? 'text-blue-700' :
                        'text-green-700'
                      }`}>
                      {order.status === 'available' ? 'New' :
                        order.status === 'in_progress' ? order.currentStep === 'delivery' ? 'Ready' : 'Collecting' :
                          'Completed'}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar for Active Orders */}
                {order.status === 'in_progress' && (
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
                <TouchableOpacity
                  onPress={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center">
                    <Feather name="shopping-bag" size={16} color="#374151" />
                    <Text className="text-sm font-bold text-gray-700 ml-2">
                      {order.vendors.length} Vendor{order.vendors.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Feather
                    name={expandedOrder === order.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>

                {/* Expanded Vendors */}
                {expandedOrder === order.id && (
                  <View className="mb-4">
                    {order.vendors.map((vendor, vIdx) => (
                      <View
                        key={vendor.id}
                        className={`border-2 rounded-2xl p-4 mb-3 ${vendor.collected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <View className="flex-row items-start justify-between mb-3">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                              <Feather name="shopping-bag" size={16} color="#3b82f6" />
                              <Text className="font-bold text-gray-900 ml-2">{vendor.name}</Text>
                            </View>
                            <Text className="text-xs text-gray-600">{vendor.address}</Text>
                          </View>
                          {vendor.collected && (
                            <View className="bg-green-500 px-3 py-1 rounded-full">
                              <Text className="text-white text-xs font-bold">✓ Done</Text>
                            </View>
                          )}
                        </View>

                        {/* Items List */}
                        <View className="space-y-2">
                          {vendor.items.map((item, iIdx) => (
                            <TouchableOpacity
                              key={iIdx}
                              onPress={() => order.status === 'in_progress' && handleToggleItemCollection(order.id, vendor.id, iIdx)}
                              className="flex-row items-center py-1"
                              activeOpacity={0.7}
                              disabled={order.status !== 'in_progress'}
                            >
                              <View className={`w-5 h-5 rounded items-center justify-center mr-2 ${item.collected ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                {item.collected && (
                                  <Feather name="check" size={14} color="white" />
                                )}
                              </View>
                              <Text className={`text-sm flex-1 ${item.collected ? 'text-gray-600 line-through' : 'text-gray-900'
                                }`}>
                                {item.name} - {item.qty}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Customer Delivery */}
                <View className="flex-row p-4 bg-green-50 rounded-2xl border-2 border-green-200 mb-4">
                  <View className="w-10 h-10 bg-green-500 rounded-full items-center justify-center shadow-md mr-3">
                    <Feather name="map-pin" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-green-700 font-bold mb-1">DELIVER TO</Text>
                    <Text className="font-bold text-gray-900">{order.customer.name}</Text>
                    <Text className="text-xs text-gray-600 mb-1">{order.customer.address}</Text>
                    <Text className="text-xs text-gray-500">📞 {order.customer.phone}</Text>
                  </View>
                </View>

                {/* Order Info */}
                <View className="flex-row gap-2 mb-4">
                  <View className="flex-1 bg-gray-50 rounded-xl p-3">
                    <Text className="text-xs text-gray-500 mb-1">Distance</Text>
                    <Text className="font-bold text-gray-900">{order.distance} km</Text>
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
                {order.status === 'available' && (
                  <TouchableOpacity
                    onPress={() => handleAcceptOrder(order)}
                    className="bg-indigo-600 py-3 rounded-xl shadow-md flex-row items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <Feather name="check-circle" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Accept Order</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'in_progress' && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 bg-indigo-600 py-3 rounded-xl shadow-md flex-row items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <Feather name="navigation" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleStartDelivery(order)}
                      disabled={order.currentStep !== 'delivery'}
                      className={`flex-1 py-3 rounded-xl shadow-md flex-row items-center justify-center ${order.currentStep === 'delivery' ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      activeOpacity={0.8}
                    >
                      <Feather name="check-circle" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Deliver</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'completed' && (
                  <View className="bg-green-100 py-3 rounded-xl flex-row items-center justify-center">
                    <Feather name="check-circle" size={18} color="#16a34a" />
                    <Text className="text-green-700 font-bold ml-2">Delivered Successfully</Text>
                  </View>
                )}
              </View>
            ))
          )}
          <View className="h-6" />
        </ScrollView>
      )}


      {showOtpModal && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* OTP Verification Modal */}
      <DeliveryOTPVerificationModal
        showOtpModal={showOtpModal}
        setShowOtpModal={setShowOtpModal}
        selectedOrderForOtp={selectedOrderForOtp}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        handleVerifyOtp={handleVerifyOtp} />
    </SafeAreaView>
  );
};

export default DeliveryOrderScreen;