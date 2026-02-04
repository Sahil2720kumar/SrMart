// app/(tabs)/customer/order/orders/index.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCustomerOrders } from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import { OrderStatus } from '@/types/orders-carts.types';


type TabType = 'all' | 'active' | 'completed';

export default function OrdersListScreen() {
  const { session } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const { data: orders, isLoading, error } = useCustomerOrders({
    status: activeTab,
  });

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      all: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-gray-100 text-gray-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-orange-100 text-orange-700',
      ready_for_pickup: 'bg-purple-100 text-purple-700',
      picked_up: 'bg-indigo-100 text-indigo-700',
      out_for_delivery: 'bg-cyan-100 text-cyan-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      refunded: 'bg-pink-100 text-pink-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      all:"All",
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      ready_for_pickup: 'Ready for Pickup',
      picked_up: 'Picked Up',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-red-600 text-center">
          Error loading orders: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'My Orders' }} />

      {/* Tabs */}
      <View className="bg-white px-4 py-3 flex-row gap-2 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => setActiveTab('all')}
          className={`flex-1 py-3 rounded-xl ${
            activeTab === 'all' ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === 'all' ? 'text-white' : 'text-gray-600'
            }`}
          >
            All Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('active')}
          className={`flex-1 py-3 rounded-xl ${
            activeTab === 'active' ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === 'active' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('completed')}
          className={`flex-1 py-3 rounded-xl ${
            activeTab === 'completed' ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === 'completed' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {orders?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ fontSize: 64 }}>📦</Text>
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
            No Orders Yet
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Start shopping to see your orders here
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/customer')}
            className="bg-green-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/customer/order/orders/${item.id}`)}
              className="bg-white rounded-2xl p-4 border border-gray-100"
              activeOpacity={0.7}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">
                    {item.order_number}
                  </Text>
                  <Text className="text-sm font-bold text-gray-900">
                    {item.vendors?.store_name}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-full ${getStatusColor(
                    item.status
                  )}`}
                >
                  <Text className="text-xs font-semibold">
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>

              {/* Items Preview */}
              <View className="mb-3">
                <Text className="text-sm text-gray-600 mb-2">
                  {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
                </Text>
                {item.order_items?.slice(0, 2).map((orderItem) => (
                  <Text
                    key={orderItem.id}
                    className="text-xs text-gray-500"
                    numberOfLines={1}
                  >
                    • {orderItem.product_name} × {orderItem.quantity}
                  </Text>
                ))}
                {item.order_items && item.order_items.length > 2 && (
                  <Text className="text-xs text-gray-500">
                    +{item.order_items.length - 2} more
                  </Text>
                )}
              </View>

              {/* Footer */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text className="text-base font-bold text-gray-900">
                  ₹{item.total_amount.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}