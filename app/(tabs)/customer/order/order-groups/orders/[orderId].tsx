import { View, Text, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  useOrderDetail,
  useOrderTimeline,
  useCancelOrder,
  useReorder,
} from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import { OrderItem, OrderStatus } from '@/types/orders-carts.types';
import { Image } from 'expo-image';
import { blurhash } from '@/types/categories-products.types';


export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { session } = useAuthStore();
  const { data: order, isLoading, error } = useOrderDetail(orderId);
  const { data: timeline } = useOrderTimeline(orderId);


  const cancelOrderMutation = useCancelOrder();
  const reorderMutation = useReorder();

  // const handleCancelOrder = () => {
  //   Alert.alert(
  //     'Cancel Order',
  //     'Are you sure you want to cancel this order?',
  //     [
  //       { text: 'No', style: 'cancel' },
  //       {
  //         text: 'Yes, Cancel',
  //         style: 'destructive',
  //         onPress: () => {
  //           Alert.prompt(
  //             'Reason for Cancellation',
  //             'Please tell us why you want to cancel',
  //             [
  //               { text: 'Cancel', style: 'cancel' },
  //               {
  //                 text: 'Submit',
  //                 onPress: (reason?: string) => {
  //                   if (!reason?.trim()) {
  //                     Alert.alert('Error', 'Please provide a reason');
  //                     return;
  //                   }

  //                   cancelOrderMutation.mutate({
  //                     orderId,
  //                     customerId: session?.user?.id || '',
  //                     reason,
  //                   });
  //                 },
  //               },
  //             ],
  //             'plain-text'
  //           );
  //         },
  //       },
  //     ]
  //   );
  // };

  const handleReorder = () => {
    reorderMutation.mutate(orderId, {
      onSuccess: () => {
        Alert.alert('Success', 'Items added to cart!', [
          {
            text: 'View Cart',
            onPress: () => router.push('/customer/order/cart'),
          },
          { text: 'Continue Shopping', style: 'cancel' },
        ]);
      },
    });
  };

  const handleCallDeliveryBoy = () => {
    if (order?.delivery_boys) {
      // Assuming delivery boy has a phone in users table
      Linking.openURL(`tel:+91XXXXXXXXXX`); // Replace with actual phone
    }
  };

  const canCancelOrder = (status: OrderStatus) => {
    return ['pending', 'confirmed', 'processing'].includes(status);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-red-600 text-center">
          Error loading order details
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
          title: `Order Details`,
          headerBackTitle: 'Orders',
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Order Status Timeline */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">
            Order Status
          </Text>

          {timeline?.map((step, index) => (
            <View key={index} className="flex-row items-start mb-4 last:mb-0">
              {/* Timeline Dot & Line */}
              <View className="items-center mr-3">
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  {step.completed ? (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  ) : (
                    <View className="w-2 h-2 bg-white rounded-full" />
                  )}
                </View>
                {index < timeline.length - 1 && (
                  <View
                    className={`w-0.5 h-12 ${step.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                  />
                )}
              </View>

              {/* Status Info */}
              <View className="flex-1 pt-0.5">
                <Text
                  className={`text-sm font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-400'
                    }`}
                >
                  {step.status}
                </Text>

                {/* {step?.description && (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {step?.description}
                  </Text>
                )} */}

                {step.timestamp && (
                  <Text className="text-xs text-gray-500 mt-1">
                    {new Date(step.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Vendor Information */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Vendor Details
          </Text>

          <View className="flex-row items-center">
            {/* Vendor Image */}
            <View className="w-14 h-14 bg-gray-200 rounded-full mr-3 overflow-hidden">
              {order.vendors?.store_image ? (
                <Image
                  source={{ uri: order.vendors.store_image }}
                  className="w-full h-full"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-green-100">
                  <Text className="text-2xl">🏪</Text>
                </View>
              )}
            </View>

            {/* Vendor Info */}
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 mb-1">
                {order.vendors?.store_name}
              </Text>
              <View className="flex-row items-center">
                <FontAwesome name="star" size={12} color="#fbbf24" />
                <Text className="text-xs text-gray-600 ml-1">
                  {order.vendors?.rating?.toFixed(1)} ({order.vendors?.review_count} reviews)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Partner (if assigned) */}
        {order.delivery_boys && (
          <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
            <Text className="text-base font-bold text-gray-900 mb-4">
              Delivery Partner
            </Text>

            <View className="flex-row items-center">
              {/* Avatar */}
              <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center mr-3">
                {order.delivery_boys.profile_photo ? (
                  <Image
                    source={{ uri: order.delivery_boys.profile_photo }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text style={{ fontSize: 24 }}>🚴</Text>
                )}
              </View>

              {/* Delivery Boy Info */}
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-1">
                  {order.delivery_boys.first_name} {order.delivery_boys.last_name}
                </Text>
                <View className="flex-row items-center mb-1">
                  <FontAwesome name="star" size={12} color="#fbbf24" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {order.delivery_boys.rating?.toFixed(1)} Rating
                  </Text>
                </View>
                <Text className="text-xs text-gray-500">
                  {order.delivery_boys.vehicle_type} • {order.delivery_boys.vehicle_number}
                </Text>
              </View>

              {/* Call Button */}
              <TouchableOpacity
                onPress={handleCallDeliveryBoy}
                className="w-10 h-10 bg-green-500 rounded-full items-center justify-center"
              >
                <Feather name="phone" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Order Items ({order.item_count})
          </Text>

          {order.order_items?.map((item: OrderItem) => (
            <View
              key={item.id}
              className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
            >
              {/* Product Image */}
              <View className="w-16 h-16 bg-gray-100 rounded-xl mr-3 overflow-hidden">
                {item.product_image ? (
                  <Image
                    source={item.product_image}
                    placeholder={{ blurhash: blurhash }}
                    contentFit="cover"
                    transition={1000}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Text className="text-2xl">📦</Text>
                  </View>
                )}
              </View>

              {/* Product Info */}
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold text-gray-900 mb-1"
                  numberOfLines={2}
                >
                  {item.product_name}
                </Text>
                <Text className="text-xs text-gray-500 mb-1">
                  ₹{item.discount_price || item.unit_price} × {item.quantity}
                </Text>
              </View>

              {/* Total Price */}
              <Text className="text-base font-bold text-gray-900">
                ₹{item.total_price.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Delivery Address
          </Text>

          <Text className="text-sm font-semibold text-gray-900 mb-1">
            {order.customer_addresses?.label || 'Home'}
          </Text>
          <Text className="text-sm text-gray-600">
            {order.customer_addresses?.address_line1}
            {order.customer_addresses?.address_line2 && `, ${order.customer_addresses.address_line2}`}
          </Text>
          <Text className="text-sm text-gray-600">
            {order.customer_addresses?.city}, {order.customer_addresses?.state} - {order.customer_addresses?.pincode}
          </Text>
        </View>

        {/* Order Summary */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">
            Order Summary
          </Text>

          <View className="mb-2">
            <Text className="text-xs text-gray-500 mb-1">Order Number</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {order.order_number}
            </Text>
          </View>

          <View className="mb-2">
            <Text className="text-xs text-gray-500 mb-1">Order Date</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {new Date(order.created_at).toLocaleString('en-US', {
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
              {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method.toUpperCase()}
            </Text>
          </View>

          <View className="h-px bg-gray-200 my-3" />

          {/* Price Breakdown */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm font-semibold text-gray-900">
              ₹{order.subtotal.toFixed(2)}
            </Text>
          </View>

          {order.discount > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Product Discount</Text>
              <Text className="text-sm font-semibold text-green-600">
                -₹{order.discount.toFixed(2)}
              </Text>
            </View>
          )}

          {order.coupon_discount > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Coupon Discount</Text>
              <Text className="text-sm font-semibold text-green-600">
                -₹{order.coupon_discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-gray-600">Delivery Fee</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {order?.is_free_delivery ? (
                <Text className="text-green-600">Free</Text>
              ) : (
                `₹${order.delivery_fee.toFixed(2)}`
              )}
            </Text>
          </View>

          {order.tax > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Tax</Text>
              <Text className="text-sm font-semibold text-gray-900">
                ₹{order.tax.toFixed(2)}
              </Text>
            </View>
          )}

          <View className="h-px bg-gray-200 my-3" />

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Total Amount</Text>
            <Text className="text-lg font-bold text-gray-900">
              ₹{order.total_amount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Special Instructions (if any) */}
        {order.special_instructions && (
          <View className="bg-blue-50 mx-4 rounded-2xl p-4 mb-3">
            <Text className="text-sm font-semibold text-blue-900 mb-1">
              Special Instructions
            </Text>
            <Text className="text-sm text-blue-700">
              {order.special_instructions}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <View className="flex-row gap-3">
          {/* {canCancelOrder(order.status) && (
            <TouchableOpacity
              // onPress={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="flex-1 bg-red-500 rounded-xl py-4 items-center justify-center"
              style={{ opacity: cancelOrderMutation.isPending ? 0.6 : 1 }}
            >
              <Text className="text-white font-bold text-base">
                {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          )} */}

          {order.status === 'delivered' && (
            <TouchableOpacity
              onPress={handleReorder}
              disabled={reorderMutation.isPending}
              className="flex-1 bg-green-500 rounded-xl py-4 items-center justify-center"
              style={{ opacity: reorderMutation.isPending ? 0.6 : 1 }}
            >
              <Text className="text-white font-bold text-base">
                {reorderMutation.isPending ? 'Adding...' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              // Navigate to help/support
              Alert.alert('Need Help?', 'Contact support at support@example.com');
            }}
            className="flex-1 bg-white border-2 border-gray-200 rounded-xl py-4 items-center justify-center"
          >
            <Text className="text-gray-900 font-bold text-base">Need Help?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}