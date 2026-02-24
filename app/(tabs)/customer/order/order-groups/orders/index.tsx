// app/(tabs)/customer/order/order-groups/[groupId].tsx
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useOrderGroupDetail } from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import { PaymentStatus, OrderStatus } from '@/types/orders-carts.types';
import { Image } from 'expo-image';
import { blurhash } from '@/types/categories-products.types';
import Toast from 'react-native-toast-message';

export default function OrderGroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { session } = useAuthStore();

  const { data: orderGroup, isLoading, error } = useOrderGroupDetail(groupId);

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getOrderStatusColor = (status: OrderStatus) => {
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

  const getOrderStatusText = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      all: 'All',
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

  const getPaymentMethodDisplay = (method?: string) => {
    switch (method) {
      case 'cod':
        return 'Cash on Delivery';
      case 'razorpay':
        return 'Online Payment (Razorpay)';
      case 'wallet':
        return 'Wallet';
      default:
        return method?.toUpperCase() || 'N/A';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (error || !orderGroup) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-red-600 text-center">
          Error loading order group details
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-green-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Order Group Details',
          headerBackTitle: 'Groups',
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Order Group Summary */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">
            Order Group Summary
          </Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Group ID</Text>
            <Text className="text-sm font-mono font-semibold text-gray-900">
              {orderGroup.id}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Created Date</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {new Date(orderGroup.created_at).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Payment Method</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {getPaymentMethodDisplay(orderGroup.payment_method)}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Payment Status</Text>
            <View className="flex-row items-center">
              <View
                className={`px-3 py-1.5 rounded-full ${getPaymentStatusColor(
                  orderGroup.payment_status
                )}`}
              >
                <Text className="text-xs font-semibold">
                  {orderGroup.payment_status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Razorpay Details */}
          {(orderGroup.razorpay_order_id || orderGroup.razorpay_payment_id) && (
            <View className="bg-gray-50 rounded-xl p-3 mt-2">
              {orderGroup.razorpay_order_id && (
                <View className="mb-2">
                  <Text className="text-xs text-gray-500 mb-1">Razorpay Order ID</Text>
                  <Text className="text-xs font-mono text-gray-700">
                    {orderGroup.razorpay_order_id}
                  </Text>
                </View>
              )}
              {orderGroup.razorpay_payment_id && (
                <View>
                  <Text className="text-xs text-gray-500 mb-1">Payment ID</Text>
                  <Text className="text-xs font-mono text-gray-700">
                    {orderGroup.razorpay_payment_id}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="h-px bg-gray-200 my-3" />

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Total Amount</Text>
            <Text className="text-xl font-bold text-gray-900">
              ₹{orderGroup.total_amount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        {orderGroup.customers && (
          <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
            <Text className="text-base font-bold text-gray-900 mb-3">
              Customer Details
            </Text>

            <View className="flex-row items-center">
              {/* Customer Image */}
              <View className="w-14 h-14 bg-gray-200 rounded-full mr-3 overflow-hidden">
                {orderGroup.customers.profile_image ? (
                  <Image
                    source={orderGroup.customers.profile_image}
                    placeholder={{ blurhash: blurhash }}
                    contentFit="cover"
                    transition={1000}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-green-100" />
                )}
              </View>

              {/* Customer Info */}
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-1">
                  {orderGroup.customers.first_name}{' '}
                  {orderGroup.customers.last_name}
                </Text>
                <Text className="text-xs text-gray-500">
                  Customer ID:{' '}
                  {String(orderGroup.customers.user_id).slice(0, 8)}...
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Orders in this Group */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 gap-y-2">
          <Text className="text-base font-bold text-gray-900">
            Orders ({orderGroup.orders?.length || 0})
          </Text>

          {orderGroup.orders && orderGroup.orders.length > 0 ? (
            orderGroup.orders.map((order, index) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/customer/order/order-groups/orders/${order.id}`)}
                className={`border border-gray-100 rounded-xl p-4 mb-3 last:mb-0 ${
                  index < orderGroup.orders.length - 1 ? 'mb-3' : ''
                }`}
                activeOpacity={0.7}
              >
                {/* Order Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">
                      {order.order_number}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      {/* Vendor Image */}
                      <View className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        {order.vendors?.store_image ? (
                          <Image
                            source={order.vendors?.store_image}
                            placeholder={{ blurhash: blurhash }}
                            contentFit="cover"
                            transition={1000}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Text className="text-lg">🏪</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                          {order.vendors?.store_name || 'Unknown Vendor'}
                        </Text>
                        {order.vendors?.rating !== null &&
                          order.vendors?.rating !== undefined && (
                            <View className="flex-row items-center">
                              <FontAwesome name="star" size={10} color="#fbbf24" />
                              <Text className="text-xs text-gray-600 ml-1">
                                {order.vendors.rating.toFixed(1)}
                              </Text>
                            </View>
                          )}
                      </View>
                    </View>
                  </View>
                  <View
                    className={`px-3 py-1.5 rounded-full ${getOrderStatusColor(order.status)}`}
                  >
                    <Text className="text-xs font-semibold">
                      {getOrderStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                {/* Order Items Preview */}
                <View className="mb-3">
                  <Text className="text-sm text-gray-600 mb-2">
                    {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                  </Text>
                  {order.order_items?.slice(0, 2).map((item) => (
                    <View key={item.id} className="flex-row items-center gap-2 mb-1">
                      <View className="w-8 h-8 bg-gray-100 rounded-md overflow-hidden">
                        {item.product_image ? (
                          <Image
                            source={item.product_image}
                            placeholder={{ blurhash: blurhash }}
                            contentFit="cover"
                            transition={300}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Text className="text-sm">📦</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-gray-600 flex-1" numberOfLines={1}>
                        {item.product_name} × {item.quantity}
                      </Text>
                      <Text className="text-xs font-semibold text-gray-700">
                        ₹{item.total_price.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  {order.order_items && order.order_items.length > 2 && (
                    <Text className="text-xs text-gray-500 ml-10">
                      +{order.order_items.length - 2} more items
                    </Text>
                  )}
                </View>

                {/* Order Total */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <Text className="text-xs text-gray-500">Order Total</Text>
                  <Text className="text-base font-bold text-gray-900">
                    ₹{order.total_amount.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center py-6">
              <Text className="text-gray-500">No orders in this group</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Need Help?',
                text2: 'Contact support at support@example.com',
                position: 'top',
                visibilityTime: 4000,
              });
            }}
            className="flex-1 bg-white border-2 border-gray-200 rounded-xl py-4 items-center justify-center"
          >
            <Text className="text-gray-900 font-bold text-base">Need Help?</Text>
          </TouchableOpacity>

          {orderGroup.razorpay_payment_id && (
            <TouchableOpacity
              onPress={() => {
                Toast.show({
                  type: 'success',
                  text1: `Payment ID: ${orderGroup.razorpay_payment_id}`,
                  text2: `₹${orderGroup.total_amount.toFixed(2)} • ${orderGroup.payment_status.toUpperCase()}`,
                  position: 'top',
                  visibilityTime: 5000,
                });
              }}
              className="flex-1 bg-green-500 rounded-xl py-4 items-center justify-center"
            >
              <Text className="text-white font-bold text-base">View Receipt</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}