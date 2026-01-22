import DeliveryActiveOrderCard from '@/components/DeliveryActiveOrderCard';
import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import DeliveryVerificationCard from '@/components/DeliveryVerificationCard';
import { Order, useDeliveryStore } from '@/store/useDeliveryStore';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ---------------- MOCK DATA ---------------- */

/* ---------------- MOCK DATA ---------------- */
/* ---------------- MOCK DATA ---------------- */
const availableOrders: Order[] = [
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
    deliveryOtp: '8429'
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
    deliveryOtp: '5612'
  }
];

/* ---------------- MAIN COMPONENT ---------------- */
const DeliveryPartnerHome = () => {
  const store = useDeliveryStore();
  const { partner, isKycCompleted, adminVerificationStatus, assignOrder } = store;
  const isVerified = adminVerificationStatus === 'approved' && isKycCompleted;

  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [stats, setStats] = useState({ todayOrders: 12, distanceKm: 24, earnings: 2450 });

  const handleAcceptOrder = (order: Order) => {
    const orderWithStatus: Order = {
      ...order,
      status: 'in_progress',
      currentStep: 'pickup',
      vendors: order.vendors.map(v => ({ ...v, collected: false }))
    };
    setActiveOrders([...activeOrders, orderWithStatus]);
    assignOrder(order.id);
    setShowOrdersModal(false);
  };

  const handleToggleVendorCollection = (orderId: string, vendorId: string) => {
    setActiveOrders(activeOrders.map(order => {
      if (order.id === orderId) {
        const updatedVendors = order.vendors.map(vendor =>
          vendor.id === vendorId ? { ...vendor, collected: !vendor.collected } : vendor
        );
        const allCollected = updatedVendors.every(v => v.collected);
        return { ...order, vendors: updatedVendors, currentStep: allCollected ? 'delivery' : 'pickup' };
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
      setActiveOrders(activeOrders.filter(o => o.id !== selectedOrderForOtp.id));
      setStats(prev => ({
        todayOrders: prev.todayOrders + 1,
        distanceKm: prev.distanceKm + selectedOrderForOtp.distance,
        earnings: prev.earnings + selectedOrderForOtp.payout
      }));
      store.clearOrder();
      setShowOtpModal(false);
      setOtpInput('');
      Alert.alert('Success', 'Order delivered successfully!');
    } else {
      Alert.alert('Invalid OTP', 'Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-indigo-600">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 py-6">
          {!isVerified ? (
             <DeliveryVerificationCard/>
          ) : (
            <>
              {/* Header */}
              <View className="mb-6 mt-4">
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-3xl font-bold text-white mb-1">
                      Hello, {store.partner?.name}
                    </Text>
                    <Text className="text-indigo-100 text-sm">Ready to deliver excellence</Text>
                  </View>

                  <TouchableOpacity
                    onPress={store.toggleOnline}
                    className={`px-6 py-3 rounded-full shadow-lg flex-row items-center gap-2 ${store.isOnline ? 'bg-green-500' : 'bg-white/20 border border-white/30'
                      }`}
                    activeOpacity={0.8}
                  >
                    <View className={`w-2.5 h-2.5 rounded-full ${store.isOnline ? 'bg-white' : 'bg-gray-300'}`} />
                    <Text className="font-bold text-white">
                      {store.isOnline ? 'Online' : 'Offline'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-white/20 border border-white/30 px-4 py-3 rounded-2xl">
                    <Text className="text-xs text-indigo-100 mb-1">Active Orders</Text>
                    <Text className="text-2xl font-bold text-white">{activeOrders.length}</Text>
                  </View>
                  <View className="flex-1 bg-white/20 border border-white/30 px-4 py-3 rounded-2xl">
                    <Text className="text-xs text-indigo-100 mb-1">Today's Earnings</Text>
                    <Text className="text-2xl font-bold text-white">₹{stats.earnings}</Text>
                  </View>
                </View>
              </View>

              {/* Active Orders */}
              {activeOrders.length > 0 ? (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-white">
                      Active Orders ({activeOrders.length})
                    </Text>
                    {store.isOnline && (
                      <TouchableOpacity
                        onPress={() => setShowOrdersModal(true)}
                        className="bg-white/20 border border-white/30 px-4 py-2 rounded-full"
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-semibold text-sm">+ Add Order</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {activeOrders.map((order, idx) => (
                    <DeliveryActiveOrderCard key={idx} order={order} idx={idx} expandedOrder={expandedOrder} setExpandedOrder={setExpandedOrder} handleStartDelivery={handleStartDelivery} handleToggleVendorCollection={handleToggleVendorCollection} />
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
                      {store.isOnline ? 'Browse available orders to get started' : 'Go online to see available orders'}
                    </Text>
                    {store.isOnline && (
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
                  <StatCard icon="package" label="Orders" value={stats.todayOrders} bgColor="bg-indigo-500" />
                  <StatCard icon="navigation" label="Distance" value={`${stats.distanceKm} km`} bgColor="bg-blue-500" />
                  <StatCard icon="dollar-sign" label="Earned" value={`₹${stats.earnings}`} bgColor="bg-green-500" />
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
                {availableOrders.length} orders waiting for delivery
              </Text>
            </View>

            <FlatList
              data={availableOrders}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 font-bold mb-1">ORDER ID</Text>
                      <Text className="text-lg font-bold text-gray-900">#{item.id}</Text>
                    </View>
                    <View className="bg-indigo-50 px-4 py-2 rounded-full">
                      <Text className="text-indigo-600 font-bold">₹{item.payout}</Text>
                    </View>
                  </View>

                  <View className="mb-4">
                    {item.vendors.map((vendor, idx) => (
                      <View key={vendor.id} className="flex-row items-start p-3 bg-blue-50 rounded-lg mb-2">
                        <Feather name="shopping-bag" size={16} color="#3b82f6" />
                        <View className="flex-1 ml-2">
                          <Text className="text-xs text-blue-600 font-bold">PICKUP {idx + 1}</Text>
                          <Text className="font-semibold text-gray-900">{vendor.name}</Text>
                          <Text className="text-xs text-gray-600">{vendor.address}</Text>
                          <Text className="text-xs text-gray-500 mt-1">{vendor.items.length} items</Text>
                        </View>
                      </View>
                    ))}

                    <View className="flex-row items-start p-3 bg-green-50 rounded-lg">
                      <Feather name="map-pin" size={16} color="#22c55e" />
                      <View className="flex-1 ml-2">
                        <Text className="text-xs text-green-600 font-bold">DELIVERY</Text>
                        <Text className="font-semibold text-gray-900">{item.customer.name}</Text>
                        <Text className="text-xs text-gray-600">{item.customer.address}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    <View className="flex-1 bg-gray-50 rounded-lg p-2">
                      <Text className="text-xs text-gray-500">Distance</Text>
                      <Text className="font-bold text-gray-900 text-sm">{item.distance} km</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 rounded-lg p-2">
                      <Text className="text-xs text-gray-500">Total Items</Text>
                      <Text className="font-bold text-gray-900 text-sm">{item.totalItems}</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 rounded-lg p-2">
                      <Text className="text-xs text-gray-500">Vendors</Text>
                      <Text className="font-bold text-gray-900 text-sm">{item.vendors.length}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAcceptOrder(item)}
                    className="bg-indigo-600 py-3 rounded-xl shadow-md"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-bold text-center">Accept Order</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

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


/* ---------------- STAT CARD COMPONENT ---------------- */

const StatCard = ({ 
  icon, 
  label, 
  value, 
  bgColor 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  value: any; 
  bgColor: string;
}) => (
  <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
    <View className={`w-10 h-10 ${bgColor} rounded-xl items-center justify-center mb-3 shadow-md`}>
      <Feather name={icon} size={20} color="white" />
    </View>
    <Text className="text-xs text-gray-500 mb-1 font-semibold">{label}</Text>
    <Text className="text-xl font-bold text-gray-900">{value}</Text>
  </View>
);

export default DeliveryPartnerHome;