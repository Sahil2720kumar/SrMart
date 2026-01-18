import SelectDeliveryPartnerBottomSheet from '@/components/SelectDeliveryPartnerBottomSheet ';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock order data
const initialOrderDetail = {
  id: 'ORD1245',
  status: 'new',
  customer: {
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
  },
  orderDate: 'Today • 2:30 PM',
  deliveryType: 'Delivery',
  items: [
    { id: '1', name: 'Fresh Tomatoes', quantity: 2, pricePerItem: 45, image: '🍅' },
    { id: '2', name: 'Organic Lettuce', quantity: 1, pricePerItem: 35, image: '🥬' },
    { id: '3', name: 'Carrots', quantity: 3, pricePerItem: 25, image: '🥕' },
  ],
  address: '123 Market Street\nApartment 5B\nNew Delhi, 110001',
  deliveryPartner: 'Not Assigned',
  estimatedTime: '15-20 minutes',
  paymentMethod: 'Paid (Online)',
  breakdown: {
    subtotal: 210,
    deliveryFee: 30,
    commission: 21,
    taxes: 19,
    total: 280,
    payout: 269,
  },
  timeline: [
    { event: 'Order Placed', time: '2:30 PM', completed: true },
    { event: 'Order Accepted', time: '', completed: false },
    { event: 'Preparing', time: '', completed: false },
    { event: 'Ready', time: '', completed: false },
    { event: 'Completed', time: '', completed: false },
  ],
};

// Delivery Partner Type
export type DeliveryPartner = {
  id: string
  name: string
  phone: string
  rating: number
  totalDeliveries: number
  distance: string
  estimatedTime: string
  vehicleType: "bike" | "scooter" | "bicycle"
  vehicleNumber: string
  isAvailable: boolean
  currentOrders: number
  profileImage?: string
}


const mockPartners: DeliveryPartner[] = [
  {
    id: "DP001",
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    rating: 4.8,
    totalDeliveries: 1250,
    distance: "0.8 km",
    estimatedTime: "3-5 min",
    vehicleType: "bike",
    vehicleNumber: "DL 8C AB 1234",
    isAvailable: true,
    currentOrders: 1,
  },
  {
    id: "DP0001",
    name: "Vishal Sharma",
    phone: "+91 98765 43210",
    rating: 4.8,
    totalDeliveries: 1250,
    distance: "10.8 km",
    estimatedTime: "3-5 min",
    vehicleType: "bike",
    vehicleNumber: "DL 8C AB 1234",
    isAvailable: true,
    currentOrders: 10,
  },
  {
    id: "DP002",
    name: "Amit Kumar",
    phone: "+91 98765 43211",
    rating: 4.9,
    totalDeliveries: 2100,
    distance: "1.2 km",
    estimatedTime: "5-7 min",
    vehicleType: "scooter",
    vehicleNumber: "DL 9D CD 5678",
    isAvailable: true,
    currentOrders: 0,
  },
  {
    id: "DP003",
    name: "Vikram Singh",
    phone: "+91 98765 43212",
    rating: 4.7,
    totalDeliveries: 980,
    distance: "2.1 km",
    estimatedTime: "8-10 min",
    vehicleType: "bicycle",
    vehicleNumber: "DL 7B EF 9012",
    isAvailable: false,
    currentOrders: 2,
  },
  {
    id: "DP004",
    name: "Sahil Kumar",
    phone: "+91 98765 43212",
    rating: 4.7,
    totalDeliveries: 980,
    distance: "2.1 km",
    estimatedTime: "8-10 min",
    vehicleType: "bicycle",
    vehicleNumber: "DL 7B EF 9012",
    isAvailable: true,
    currentOrders: 2,
  },
]


const statusConfig = {
  new: { label: 'New', color: 'bg-orange-500', textColor: 'text-orange-700' },
  preparing: { label: 'Preparing', color: 'bg-blue-500', textColor: 'text-blue-700' },
  ready: { label: 'Ready', color: 'bg-purple-500', textColor: 'text-purple-700' },
  completed: { label: 'Completed', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-700' },
};

export default function OrderDetailScreen() {
  const {orderId}=useLocalSearchParams()
  const [isLoading, setIsLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState(initialOrderDetail);
  const [isVisible, setIsVisible] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null)

  const config = statusConfig[orderDetail.status as keyof typeof statusConfig];

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const updateTimeline = (status: string) => {
    const timeline = [...orderDetail.timeline];
    const currentTime = getCurrentTime();

    switch (status) {
      case 'preparing':
        timeline[1].completed = true;
        timeline[1].time = currentTime;
        timeline[2].active = true;
        break;
      case 'ready':
        timeline[2].completed = true;
        timeline[2].time = currentTime;
        timeline[2].active = false;
        timeline[3].active = true;
        break;
      case 'completed':
        timeline[3].completed = true;
        timeline[3].time = currentTime;
        timeline[3].active = false;
        timeline[4].completed = true;
        timeline[4].time = currentTime;
        break;
      case 'cancelled':
        // Mark all as incomplete when cancelled
        timeline.forEach((item, idx) => {
          if (idx > 0) {
            item.completed = false;
            item.active = false;
            item.time = 'Cancelled';
          }
        });
        break;
    }

    return timeline;
  };

  const handleAction = (action: string) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      let newStatus = orderDetail.status;
      let updatedTimeline = orderDetail.timeline;

      switch (action) {
        case 'accept':
          newStatus = 'preparing';
          updatedTimeline = updateTimeline('preparing');
          Alert.alert('Success', 'Order accepted and moved to preparing!');
          break;
        case 'reject':
          newStatus = 'cancelled';
          updatedTimeline = updateTimeline('cancelled');
          Alert.alert('Order Rejected', 'The order has been cancelled.');
          break;
        case 'ready':
          newStatus = 'ready';
          updatedTimeline = updateTimeline('ready');
          Alert.alert('Success', 'Order marked as ready for delivery!');
          break;
        case 'handover':
          newStatus = 'completed';
          updatedTimeline = updateTimeline('completed');
          Alert.alert('Success', 'Order handed over to delivery partner!');
          break;
      }

      setOrderDetail({
        ...orderDetail,
        status: newStatus,
        timeline: updatedTimeline,
      });

      setIsLoading(false);
    }, 800);
  };

  const getActionButtons = (status: string) => {
    switch (status) {
      case 'new':
        return [
          { label: 'Accept Order', style: 'bg-emerald-500 text-white', action: 'accept' },
          { label: 'Reject Order', style: 'bg-red-100 text-red-700', action: 'reject' },
        ];
      case 'preparing':
        return [
          { label: 'Mark as Ready', style: 'bg-purple-500 text-white', action: 'ready' },
        ];
      case 'ready':
        return [
          { label: 'Handover to Delivery', style: 'bg-emerald-500 text-white', action: 'handover' },
        ];
      default:
        return [];
    }
  };

  const actions = getActionButtons(orderDetail.status);
  const totalItems = orderDetail.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={()=>router.back()} className="p-2 -ml-2">
          <Feather name="chevron-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View className="flex-1 ml-2">
          <Text className="text-xl font-bold text-gray-900">Order Details</Text>
          <Text className="text-sm text-gray-600 mt-1">#{orderId}</Text>
        </View>
        <View className={`${config.color} rounded-full px-3 py-1`}>
          <Text className="text-white text-xs font-semibold">{config.label}</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Order Summary Card */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">ORDER SUMMARY</Text>
            <View className="space-y-2 mb-4">
              <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
                <Text className="text-gray-600 text-sm">Order ID</Text>
                <Text className="text-gray-900 font-semibold">#{orderDetail.id}</Text>
              </View>
              <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
                <Text className="text-gray-600 text-sm">Date & Time</Text>
                <Text className="text-gray-900 font-semibold">{orderDetail.orderDate}</Text>
              </View>
              <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
                <Text className="text-gray-600 text-sm">Payment Method</Text>
                <Text className="text-gray-900 font-semibold text-emerald-600">{orderDetail.paymentMethod}</Text>
              </View>
              <View className="flex-row justify-between items-center pt-2">
                <Text className="text-gray-600 text-sm font-semibold">Total Amount</Text>
                <Text className="text-2xl font-bold text-emerald-600">₹{orderDetail.breakdown.total}</Text>
              </View>
            </View>
          </View>

          {/* Items List */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">ITEMS ({totalItems})</Text>
            {orderDetail.items.map((item, index) => (
              <View key={item.id} className={`flex-row pb-3 ${index !== orderDetail.items.length - 1 ? 'border-b border-gray-100 mb-3' : ''}`}>
                <View className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl items-center justify-center mr-3">
                  <Text className="text-2xl">{item.image}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-sm">{item.name}</Text>
                  <Text className="text-gray-600 text-xs mt-1">₹{item.pricePerItem} × {item.quantity}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-900 font-bold text-sm">₹{item.pricePerItem * item.quantity}</Text>
                  <Text className="text-emerald-600 text-xs font-semibold mt-1">Qty: {item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Customer Information */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">CUSTOMER INFO</Text>
            <View className="flex-row items-center pb-3 border-b border-gray-100 mb-3">
              <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center mr-3">
                <Text className="text-lg">👤</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm">{orderDetail.customer.name}</Text>
                <Text className="text-gray-600 text-xs mt-1">{orderDetail.deliveryType}</Text>
              </View>
            </View>
            <TouchableOpacity className="flex-row items-center gap-3 bg-blue-50 rounded-xl p-3">
              <Feather name="phone" size={18} color="#2563eb" />
              <Text className="text-blue-700 font-semibold text-sm flex-1">{orderDetail.customer.phone}</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Information */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">DELIVERY INFO</Text>
            <View className="mb-3 pb-3 border-b border-gray-100">
              <View className="flex-row items-start gap-2 mb-3">
                <Feather name="map-pin" size={18} color="#6b7280" className="mt-1" />
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs mb-1">DELIVERY ADDRESS</Text>
                  <Text className="text-gray-900 font-semibold text-sm leading-5">{orderDetail.address}</Text>
                </View>
              </View>
            </View>
            <View className="flex-row justify-between pb-3 border-b border-gray-100 mb-3">
              <View>
                <Text className="text-gray-600 text-xs mb-1">DELIVERY PARTNER</Text>
                {/* <Text className="text-gray-900 font-semibold text-sm">{orderDetail.deliveryPartner}</Text> */}
                <Text className="text-gray-900 font-semibold text-sm">{selectedPartner?.name || orderDetail.deliveryPartner}</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-600 text-xs mb-1">ETA</Text>
                <Text className="text-gray-900 font-semibold text-sm">{orderDetail.estimatedTime}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={()=>setIsVisible(!isVisible)} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex-row items-center justify-center gap-2">
              <Feather name='truck' size={18} color="#059669" />
              <Text className="text-emerald-700 font-semibold text-sm">Assign Delivery Partner</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Breakdown */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">PAYMENT BREAKDOWN</Text>
            <View className="space-y-2 mb-3 pb-3 border-b border-gray-100">
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm">Item Subtotal</Text>
                <Text className="text-gray-900 font-semibold text-sm">₹{orderDetail.breakdown.subtotal}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm">Delivery Fee</Text>
                <Text className="text-gray-900 font-semibold text-sm">₹{orderDetail.breakdown.deliveryFee}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm">Platform Commission</Text>
                <Text className="text-gray-900 font-semibold text-sm">-₹{orderDetail.breakdown.commission}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm">Taxes</Text>
                <Text className="text-gray-900 font-semibold text-sm">₹{orderDetail.breakdown.taxes}</Text>
              </View>
            </View>
            <View className="flex-row justify-between mb-2 pb-3 border-b border-gray-100">
              <Text className="text-gray-900 font-semibold">Total Amount</Text>
              <Text className="text-emerald-600 font-bold text-lg">₹{orderDetail.breakdown.total}</Text>
            </View>
            <View className="flex-row justify-between pt-2 bg-emerald-50 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
              <Text className="text-emerald-700 font-semibold text-sm">Your Payout</Text>
              <Text className="text-emerald-700 font-bold text-base">₹{orderDetail.breakdown.payout}</Text>
            </View>
          </View>

          {/* Order Timeline */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-4">ORDER TIMELINE</Text>
            {orderDetail.timeline.map((item, index) => (
              <View key={index} className="flex-row mb-4">
                {/* Timeline Line */}
                <View className="w-8 items-center mr-4">
                  <View
                    className={`w-3 h-3 rounded-full ${item.completed
                        ? 'bg-emerald-500'
                        : item.active
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                  />
                  {index !== orderDetail.timeline.length - 1 && (
                    <View
                      className={`w-0.5 h-8 mt-2 ${item.completed ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                    />
                  )}
                </View>
                {/* Timeline Content */}
                <View className="flex-1 py-1">
                  <Text className={`font-semibold text-sm ${item.active ? 'text-blue-700' : 'text-gray-900'}`}>
                    {item.event}
                  </Text>
                  <Text className="text-gray-600 text-xs mt-1">{item.time || 'Pending'}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Sticky Action Buttons */}
      {actions.length > 0 && (
        <View className="bg-white px-4 py-4 border-t border-gray-200 safe-area-bottom">
          <View className="flex-row gap-3">
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => handleAction(action.action)}
                className={`flex-1 rounded-xl py-4 items-center justify-center ${action.style}`}
              >
                <Text className={`font-bold text-base ${action.style.includes('bg-emerald') || action.style.includes('bg-purple') ? 'text-white' : 'text-red-700'}`}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {isVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}
      <SelectDeliveryPartnerBottomSheet
        isVisible={isVisible}
        partners={mockPartners}
        selectedPartner={selectedPartner}
        onSelectPartner={setSelectedPartner}
        onClose={() => setIsVisible(false)}
        onConfirm={() => {
          console.log('Assigned partner:', selectedPartner)
          setIsVisible(false)
        }}
      />
    </SafeAreaView>
  );
}