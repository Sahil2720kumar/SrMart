import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Feather } from '@expo/vector-icons'
import { Order } from '@/store/useDeliveryStore'

interface DeliveryActiveOrderCardProps{
  order:Order
  idx:number
  setExpandedOrder:(orderId:string | null)=>void
  expandedOrder:string | null
  handleToggleVendorCollection:(orderId:string,vendorId:string)=>void
  handleStartDelivery: (order: Order)=>void
}

const DeliveryActiveOrderCard = ({order,idx,setExpandedOrder,expandedOrder,handleStartDelivery,handleToggleVendorCollection}:DeliveryActiveOrderCardProps) => {
  return (
    <View key={order.id} className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
    <View className="flex-row items-center justify-between mb-4">
      <View>
        <Text className="text-xs text-gray-500 font-bold tracking-wider mb-1">
          ORDER {idx + 1}
        </Text>
        <Text className="text-xl font-bold text-gray-900">#{order.id}</Text>
      </View>
      <View className={`px-4 py-2 rounded-full shadow-md ${order.currentStep === 'pickup' ? 'bg-blue-500' : 'bg-green-500'
        }`}>
        <Text className="text-white font-bold text-sm">
          {order.currentStep === 'pickup' ? 'Collecting' : 'Ready to Deliver'}
        </Text>
      </View>
    </View>

    {/* Vendor Pickups */}
    <View className="mb-4">
      <TouchableOpacity
        onPress={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
        className="flex-row items-center justify-between mb-3"
        activeOpacity={0.8}
      >
        <View className="flex-row items-center">
          <Feather name="shopping-bag" size={16} color="#374151" />
          <Text className="text-sm font-bold text-gray-700 ml-2">
            Pickup from {order.vendors.length} vendor{order.vendors.length > 1 ? 's' : ''}
          </Text>
        </View>
        <Feather
          name={expandedOrder === order.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6b7280"
        />
      </TouchableOpacity>

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
                <TouchableOpacity
                  onPress={() => handleToggleVendorCollection(order.id, vendor.id)}
                  className={`px-4 py-2 rounded-lg ${vendor.collected
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                    }`}
                  activeOpacity={0.8}
                >
                  <Text className="font-bold text-sm text-white">
                    {vendor.collected ? '✓ Collected' : 'Collect'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                {vendor.items.map((item, iIdx) => (
                  <View key={iIdx} className="flex-row items-center mb-2">
                    <View className={`w-5 h-5 rounded items-center justify-center ${vendor.collected ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                      {vendor.collected && (
                        <Feather name="check" size={14} color="white" />
                      )}
                    </View>
                    <Text className={`text-sm ml-2 ${vendor.collected ? 'text-gray-600 line-through' : 'text-gray-900'
                      }`}>
                      {item.name} - {item.qty}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>

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

    {/* Actions */}
    <View className="flex-row gap-3">
      <TouchableOpacity
        className="flex-1 bg-indigo-600 py-3 rounded-xl shadow-md flex-row items-center justify-center gap-2"
        activeOpacity={0.8}
      >
        <Feather name="navigation" size={18} color="white" />
        <Text className="text-white font-bold">Navigate</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleStartDelivery(order)}
        disabled={order.currentStep !== 'delivery'}
        className={`flex-1 py-3 rounded-xl shadow-md flex-row items-center justify-center gap-2 ${order.currentStep === 'delivery'
            ? 'bg-green-500'
            : 'bg-gray-300'
          }`}
        activeOpacity={0.8}
      >
        <Feather name="check-circle" size={18} color="white" />
        <Text className="text-white font-bold">Deliver</Text>
      </TouchableOpacity>
    </View>
  </View>
  )
}

export default DeliveryActiveOrderCard