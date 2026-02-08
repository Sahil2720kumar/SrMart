import { View, Text, TouchableOpacity, Linking } from 'react-native'
import React from 'react'
import { Feather } from '@expo/vector-icons'
import { DeliveryOrder } from '@/types/delivery-orders.types'
import { router } from 'expo-router'

interface DeliveryActiveOrderCardProps {
  order: DeliveryOrder
  idx: number
  handleMarkPickedUp: (order: DeliveryOrder) => void
  handleStartDelivery: (order: DeliveryOrder) => void
}
 
const DeliveryActiveOrderCard = ({
  order,
  idx,
  handleMarkPickedUp,
  handleStartDelivery
}: DeliveryActiveOrderCardProps) => {
  
  const getCollectedVendorsCount = () => {
    return order.vendors.filter(v => v.collected).length;
  };

  const handleNavigate = () => {
    const { lat, lng } = order.customer;
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url);
    }
  };

  return (
    <TouchableOpacity onPress={()=>router.push(`/delivery/order/${order.id}`)} key={order.id} className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
      {/* Order Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 font-bold tracking-wider mb-1">
            ORDER #{idx + 1}
          </Text>
          <Text className="text-md font-bold text-gray-900">{order.order_number}</Text>
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

      {/* Progress Bar */}
      {order.status !== 'delivered' && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-gray-600">
              Pickup Progress
            </Text>
            <Text className="text-xs font-bold text-indigo-600">
              {getCollectedVendorsCount()}/{order.vendors.length} vendors
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${(getCollectedVendorsCount() / order.vendors.length) * 100}%` }}
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
          <Text className="text-xs text-gray-600 mb-1" numberOfLines={2}>
            {order.customer.address}
          </Text>
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
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handleNavigate}
          className="flex-1 bg-blue-500 py-3 rounded-xl shadow-md flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Feather name="navigation" size={18} color="white" />
          <Text className="text-white font-bold ml-2">Navigate</Text>
        </TouchableOpacity>
        
        {order.status === 'ready_for_pickup' ? (
          <TouchableOpacity
            onPress={() => handleMarkPickedUp(order)}
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
    </TouchableOpacity>
  )
}

export default DeliveryActiveOrderCard