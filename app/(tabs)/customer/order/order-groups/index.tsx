import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useCustomerOrderGroups } from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import { PaymentStatus } from '@/types/orders-carts.types';
import Feather from '@expo/vector-icons/Feather';

type TabType = 'all' | 'paid' | 'pending';

export default function OrderGroupsListScreen() {
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const { data: orderGroups, isLoading, error } = useCustomerOrderGroups({
    paymentStatus: activeTab === 'all' ? undefined : activeTab,
  });

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentStatusText = (status: PaymentStatus) => {
    const labels: Record<PaymentStatus, string> = {
      pending: 'Pending',
      paid: 'Paid',
      failed: 'Failed',
      refunded: 'Refunded',
    };
    return labels[status] || status;
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'cod':
        return '💸'
      default:
        return '💳';
    }
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
          Error loading order groups: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* <Stack.Screen options={{ title: 'My Order Groups' }} /> */}

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
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('paid')}
          className={`flex-1 py-3 rounded-xl ${
            activeTab === 'paid' ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === 'paid' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Paid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('pending')}
          className={`flex-1 py-3 rounded-xl ${
            activeTab === 'pending' ? 'bg-green-500' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === 'pending' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Pending
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order Groups List */}
      {orderGroups?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ fontSize: 64 }}>🛍️</Text>
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
            No Order Groups Yet
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Start shopping to see your order groups here
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
          data={orderGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/customer/order/order-groups/orders?groupId=${item.id}`)}
              className="bg-white rounded-2xl p-4 border border-gray-100"
              activeOpacity={0.7}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text style={{ fontSize: 20 }}>
                      {getPaymentMethodIcon(item.payment_method)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-500">
                    Group ID: {item.id.slice(0, 8)}...
                  </Text>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-full ${getPaymentStatusColor(
                    item.payment_status
                  )}`}
                >
                  <Text className="text-xs font-semibold">
                    {getPaymentStatusText(item.payment_status)}
                  </Text>
                </View>
              </View>

              {/* Orders Count */}
              <View className="flex-row items-center gap-2 mb-3">
                <View className="flex-row items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full">
                  <Feather name="package" size={14} color="#3b82f6" />
                  <Text className="text-xs font-semibold text-blue-600">
                    {item.orders?.length || 0} {item.orders?.length === 1 ? 'Order' : 'Orders'}
                  </Text>
                </View>

                {item.payment_method && (
                  <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                    <Text className="text-xs font-semibold text-gray-700">
                      {item.payment_method === 'cod' 
                        ? 'Cash on Delivery' 
                        : item.payment_method === 'razorpay'
                        ? 'Online Payment'
                        : item.payment_method.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Vendors Preview */}
              {item.orders && item.orders.length > 0 && (
                <View className="mb-3 border-t border-gray-100 pt-3">
                  <Text className="text-xs text-gray-500 mb-2">Vendors:</Text>
                  {item.orders.slice(0, 3).map((order, index) => (
                    <View key={order.id} className="flex-row items-center gap-2 mb-1">
                      <View className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <Text className="text-xs text-gray-600" numberOfLines={1}>
                        {order.vendors?.store_name || 'Unknown Vendor'}
                      </Text>
                    </View>
                  ))}
                  {item.orders.length > 3 && (
                    <Text className="text-xs text-gray-500 ml-3">
                      +{item.orders.length - 3} more
                    </Text>
                  )}
                </View>
              )}

              {/* Payment IDs (if available) */}
              {(item.razorpay_order_id || item.razorpay_payment_id) && (
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                  {item.razorpay_order_id && (
                    <View className="mb-1">
                      <Text className="text-xs text-gray-500">Razorpay Order ID:</Text>
                      <Text className="text-xs font-mono text-gray-700">
                        {item.razorpay_order_id}
                      </Text>
                    </View>
                  )}
                  {item.razorpay_payment_id && (
                    <View>
                      <Text className="text-xs text-gray-500">Payment ID:</Text>
                      <Text className="text-xs font-mono text-gray-700">
                        {item.razorpay_payment_id}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Footer */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <Text className="text-sm text-gray-600">Total Amount</Text>
                <Text className="text-lg font-bold text-gray-900">
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