import Feather from "@expo/vector-icons/Feather"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native"
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams } from "expo-router";

// ============= MOCK DATA =============
type Order = {
  id: string
  orderNumber: string
  date: string
  time: string
  status: "ordered" | "processing" | "shipped" | "out_for_delivery" | "delivered"
  itemCount: number
  totalAmount: number
  items: OrderItem[]
}

type OrderItem = {
  id: string
  name: string
  weight: string
  price: number
  quantity: number
}

type DeliveryBoy = {
  name: string
  phone: string
  rating: number
}

type OrderStatus = {
  status: string
  date: string
  time: string
  completed: boolean
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2025-001",
    date: "Jan 15, 2026",
    time: "10:30 AM",
    status: "delivered",
    itemCount: 3,
    totalAmount: 42.5,
    items: [
      { id: "1", name: "Fortune Sun Lite Refined Sunflower Oil", weight: "5 L", price: 12, quantity: 1 },
      { id: "2", name: "Aashirvaad Shudh Aata", weight: "10 kg", price: 12, quantity: 2 },
      { id: "3", name: "Tata Salt", weight: "1 kg", price: 6.5, quantity: 1 },
    ],
  },
  {
    id: "2",
    orderNumber: "ORD-2025-002",
    date: "Jan 16, 2026",
    time: "02:15 PM",
    status: "out_for_delivery",
    itemCount: 2,
    totalAmount: 28,
    items: [
      { id: "1", name: "Nescafe Classic Coffee", weight: "200g", price: 8, quantity: 1 },
      { id: "2", name: "Britannia Good Day Cookies", weight: "500g", price: 20, quantity: 1 },
    ],
  },
  {
    id: "3",
    orderNumber: "ORD-2025-003",
    date: "Jan 17, 2026",
    time: "09:45 AM",
    status: "processing",
    itemCount: 4,
    totalAmount: 65,
    items: [
      { id: "1", name: "Surf Excel Detergent", weight: "1 kg", price: 15, quantity: 2 },
      { id: "2", name: "Dove Soap", weight: "125g", price: 10, quantity: 3 },
      { id: "3", name: "Colgate Toothpaste", weight: "200g", price: 5, quantity: 1 },
    ],
  },
]

const deliveryBoy: DeliveryBoy = {
  name: "Rajesh Kumar",
  phone: "+91 98765 43210",
  rating: 4.8,
}



// ============= ORDER DETAILS SCREEN =============
export default function OrderDetailsScreen() {
  const {orderId}=useLocalSearchParams()
  // Mock data - in real app, fetch by order ID
  const order = mockOrders[1] // Using the "out for delivery" order

  const orderStatuses: OrderStatus[] = [
    { status: "Ordered", date: "Jan 16, 2026", time: "02:15 PM", completed: true },
    { status: "Processing", date: "Jan 16, 2026", time: "02:45 PM", completed: true },
    { status: "Shipped", date: "Jan 16, 2026", time: "05:30 PM", completed: true },
    { status: "Out for Delivery", date: "Jan 17, 2026", time: "09:00 AM", completed: true },
    { status: "Delivered", date: "", time: "", completed: false },
  ]

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View className="flex-row items-center py-3 border-b border-gray-100">
      {/* Product Image Placeholder */}
      <View className="w-16 h-16 bg-gray-100 rounded-xl mr-3 items-center justify-center">
        <View className="w-12 h-12 bg-gray-200 rounded-lg" />
      </View>

      {/* Product Info */}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-500 mb-1">{item.weight}</Text>
        <Text className="text-sm font-bold text-gray-900">
          ${item.price} × {item.quantity}
        </Text>
      </View>

      {/* Total Price */}
      <Text className="text-base font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{headerTitle:`Order#${orderId}`}}  />
      {/* Header */}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Order Status Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">Order Status</Text>

          {orderStatuses.map((status, index) => (
            <View key={index} className="flex-row items-start mb-4 last:mb-0">
              {/* Timeline Dot & Line */}
              <View className="items-center mr-3">
                <View
                  className={`w-5 h-5 rounded-full items-center justify-center ${status.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                >
                  {status.completed && <Text className="text-white text-xs font-bold">✓</Text>}
                </View>
                {index < orderStatuses.length - 1 && (
                  <View
                    className={`w-0.5 h-10 ${status.completed ? "bg-green-500" : "bg-gray-300"}`}
                  />
                )}
              </View>

              {/* Status Info */}
              <View className="flex-1 pt-0.5">
                <Text
                  className={`text-sm font-semibold ${status.completed ? "text-gray-900" : "text-gray-400"
                    }`}
                >
                  {status.status}
                </Text>
                {status.date && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {status.date} • {status.time}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Order Items */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">Order Items</Text>
          <FlatList
            data={order.items}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Delivery Boy Information */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">Delivery Partner</Text>

          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center mr-3">
              <Text style={{ fontSize: 24 }}>👨</Text>
            </View>

            {/* Delivery Boy Info */}
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 mb-1">{deliveryBoy.name}</Text>
              <View className="flex-row items-center mb-1">
                <FontAwesome name="star" size={12} color="#fbbf24" />
                <Text className="text-xs text-gray-600 ml-1">{deliveryBoy.rating} Rating</Text>
              </View>
              <Text className="text-xs text-gray-500">{deliveryBoy.phone}</Text>
            </View>

            {/* Call Button */}
            <TouchableOpacity className="w-10 h-10 bg-green-500 rounded-full items-center justify-center">
            <Feather name="phone" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Information */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">Order Information</Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Order Number</Text>
            <Text className="text-sm font-semibold text-gray-900">{order.orderNumber}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Order Date</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {order.date} at {order.time}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Payment Method</Text>
            <Text className="text-sm font-semibold text-gray-900">Cash on Delivery</Text>
          </View>

          <View className="h-px bg-gray-200 my-3" />

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-gray-600">Delivery Fee</Text>
            <Text className="text-sm font-semibold text-green-600">Free</Text>
          </View>

          <View className="h-px bg-gray-200 my-3" />

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Total Amount</Text>
            <Text className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 gap-3">
          <TouchableOpacity className="bg-green-500 rounded-2xl py-4 items-center justify-center">
            <Text className="text-white font-bold text-base">Track Order</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white border-2 border-gray-200 rounded-2xl py-4 items-center justify-center">
            <Text className="text-gray-900 font-bold text-base">Need Help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

