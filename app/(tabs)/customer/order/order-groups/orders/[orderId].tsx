import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import {
  useOrderDetail,
  useOrderTimeline,
  useCancelOrder,
  useReorder,
} from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import { OrderItem, OrderStatus } from '@/types/orders-carts.types';
import { Image } from 'expo-image';
import { blurhash, Product } from '@/types/categories-products.types';
import useCartStore from '@/store/cartStore';
import Toast from 'react-native-toast-message';

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price',
  'Delivery time too long',
  'Other',
];

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { session } = useAuthStore();
  const { data: order, isLoading, error } = useOrderDetail(orderId);
  const { data: timeline } = useOrderTimeline(orderId);
  const { addToCart, updateQuantity } = useCartStore();

  const [cancelModal, setCancelModal]               = useState(false);
  const [selectedReason, setSelectedReason]         = useState('');
  const [customReason, setCustomReason]             = useState('');

  const cancelOrderMutation = useCancelOrder();
  const reorderMutation     = useReorder();

  type ReorderItem = {
    product_id: string;
    quantity: number;
    products: Product;
  };

  const handleReorder = () => {
    reorderMutation.mutate(orderId, {
      onSuccess: (items: ReorderItem[]) => {
        items.forEach(({ products, quantity }) => {
          addToCart(products);
          if (quantity > 1) {
            updateQuantity(products.id, quantity - 1);
          }
        });
        Toast.show({
          type: 'success',
          text1: 'Items added to cart!',
          text2: 'Tap to view your cart',
          position: 'top',
          onPress: () => router.push('/customer/order/cart'),
        });
      },
    });
  };

  const handleCallDeliveryBoy = () => {
    if (order?.delivery_boys) {
      Linking.openURL(`tel:+91${order?.delivery_boys.users.phone}`);
    }
  };

  const canCancelOrder = (status: OrderStatus) =>
    ['pending', 'confirmed', 'processing'].includes(status);

  const handleConfirmCancel = () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;

    if (!reason) {
      Toast.show({ type: 'error', text1: 'Please select a reason', position: 'top' });
      return;
    }

    cancelOrderMutation.mutate(
      { orderId, reason },
      {
        onSuccess: () => {
          setCancelModal(false);
          setSelectedReason('');
          setCustomReason('');
          Toast.show({
            type: 'success',
            text1: 'Order Cancelled',
            text2: 'Your order has been cancelled successfully.',
            position: 'top',
          });
        },
        onError: (err: any) => {
          Toast.show({
            type: 'error',
            text1: 'Failed to cancel',
            text2: err.message || 'Please try again.',
            position: 'top',
          });
        },
      }
    );
  };

  // ─── Loading / Error ──────────────────────────────────────────────────────

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
        <Text className="text-red-600 text-center">Error loading order details</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-green-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const allItems       = order.order_items ?? [];
  const activeItems    = allItems.filter((i: OrderItem) => (i as any).status !== 'cancelled');
  const cancelledItems = allItems.filter((i: OrderItem) => (i as any).status === 'cancelled');

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Order Details', headerBackTitle: 'Orders' }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Order Status Timeline ─────────────────────────────────────── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">Order Status</Text>

          {timeline?.map((step, index) => (
            <View key={index} className="flex-row items-start mb-4 last:mb-0">
              <View className="items-center mr-3">
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
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
                    className={`w-0.5 h-12 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </View>

              <View className="flex-1 pt-0.5">
                <Text
                  className={`text-sm font-semibold ${
                    step.completed ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.status}
                </Text>
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

        {/* ── Cancellation Reason (if cancelled) ───────────────────────── */}
        {order.status === 'cancelled' && order.cancellation_reason && (
          <View className="bg-red-50 mx-4 rounded-2xl p-4 mb-3 border border-red-200">
            <View className="flex-row items-center mb-2">
              <Feather name="x-circle" size={16} color="#dc2626" />
              <Text className="text-sm font-bold text-red-900 ml-2">
                Cancellation Reason
              </Text>
            </View>
            <Text className="text-sm text-red-700">{order.cancellation_reason}</Text>
            {order.cancelled_by && (
              <Text className="text-xs text-red-500 mt-1 capitalize">
                Cancelled by: {order.cancelled_by}
              </Text>
            )}
          </View>
        )}

        {/* ── Delivery OTP ──────────────────────────────────────────────── */}
        {order.delivery_otp &&
          !['delivered', 'cancelled', 'refunded'].includes(order.status) && (
            <View className="bg-green-50 mx-4 rounded-2xl p-4 mb-3 border border-green-200">
              <View className="flex-row items-center mb-2">
                <Feather name="shield" size={16} color="#16a34a" />
                <Text className="text-sm font-bold text-green-900 ml-2">
                  Delivery OTP
                </Text>
              </View>
              <Text className="text-xs text-green-700 mb-3">
                Share this OTP with your delivery partner to confirm receipt of your order.
              </Text>
              <View className="flex-row justify-center gap-2">
                {order.delivery_otp.split('').map((digit: string, index: number) => (
                  <View
                    key={index}
                    className="w-12 h-14 bg-white rounded-xl border-2 border-green-400 items-center justify-center"
                  >
                    <Text className="text-2xl font-bold text-green-700">{digit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        {/* ── Vendor Information ────────────────────────────────────────── */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">Vendor Details</Text>

          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-gray-200 rounded-full mr-3 overflow-hidden">
              {order.vendors?.store_image ? (
                <Image
                  source={order.vendors?.store_image}
                  placeholder={{ blurhash }}
                  contentFit="cover"
                  transition={1000}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-green-100">
                  <Text className="text-2xl">🏪</Text>
                </View>
              )}
            </View>
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

        {/* ── Delivery Partner ──────────────────────────────────────────── */}
        {order.delivery_boys && (
          <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
            <Text className="text-base font-bold text-gray-900 mb-4">
              Delivery Partner
            </Text>

            <View className="flex-row items-center">
              <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center mr-3 overflow-hidden">
                {order.delivery_boys.profile_photo ? (
                  <Image
                    source={order.delivery_boys.profile_photo}
                    placeholder={{ blurhash }}
                    contentFit="cover"
                    transition={1000}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Text style={{ fontSize: 24 }}>🚴</Text>
                )}
              </View>

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

              <TouchableOpacity
                onPress={handleCallDeliveryBoy}
                className="w-10 h-10 bg-green-500 rounded-full items-center justify-center"
              >
                <Feather name="phone" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Order Items ───────────────────────────────────────────────── */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Order Items ({order.item_count})
          </Text>

          {/* Active items */}
          {activeItems.map((item: OrderItem) => (
            <View
              key={item.id}
              className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
            >
              <View className="w-16 h-16 bg-gray-100 rounded-xl mr-3 overflow-hidden">
                {item.product_image ? (
                  <Image
                    source={item.product_image}
                    placeholder={{ blurhash }}
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

              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
                  {item.product_name}
                </Text>
                <Text className="text-xs text-gray-500 mb-1">
                  ₹{item.discount_price || item.unit_price} × {item.quantity}
                </Text>
              </View>

              <Text className="text-base font-bold text-gray-900">
                ₹{item.total_price.toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Cancelled items — dimmed + strikethrough */}
          {cancelledItems.length > 0 && (
            <View className="mt-3 pt-3 border-t border-dashed border-gray-200">
              <Text className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">
                Cancelled Items ({cancelledItems.length})
              </Text>
              {cancelledItems.map((item: OrderItem) => (
                <View
                  key={item.id}
                  className="flex-row items-center py-2 opacity-50"
                >
                  <View className="w-12 h-12 bg-gray-100 rounded-xl mr-3 overflow-hidden">
                    {item.product_image ? (
                      <Image
                        source={item.product_image}
                        placeholder={{ blurhash }}
                        contentFit="cover"
                        transition={1000}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text className="text-lg">📦</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-sm text-gray-500 line-through"
                      numberOfLines={1}
                    >
                      {item.product_name}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      ₹{item.discount_price || item.unit_price} × {item.quantity}
                    </Text>
                  </View>

                  <View className="bg-red-100 rounded-lg px-2 py-1">
                    <Text className="text-red-500 text-xs font-semibold">Cancelled</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Delivery Address ──────────────────────────────────────────── */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Delivery Address
          </Text>

          <Text className="text-sm font-semibold text-gray-900 mb-1">
            {order.customer_addresses?.label || 'Home'}
          </Text>
          <Text className="text-sm text-gray-600">
            {order.customer_addresses?.address_line1}
            {order.customer_addresses?.address_line2 &&
              `, ${order.customer_addresses.address_line2}`}
          </Text>
          <Text className="text-sm text-gray-600">
            {order.customer_addresses?.city}, {order.customer_addresses?.state} -{' '}
            {order.customer_addresses?.pincode}
          </Text>
        </View>

        {/* ── Order Summary ─────────────────────────────────────────────── */}
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3">
          <Text className="text-base font-bold text-gray-900 mb-4">Order Summary</Text>

          <View className="mb-2">
            <Text className="text-xs text-gray-500 mb-1">Order Number</Text>
            <Text className="text-sm font-semibold text-gray-900">{order.order_number}</Text>
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
              {order.payment_method === 'cod'
                ? 'Cash on Delivery'
                : order.payment_method.toUpperCase()}
            </Text>
          </View>

          <View className="h-px bg-gray-200 my-3" />

          {/* Price Breakdown */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm font-semibold text-gray-900">
              ₹{Number(order.subtotal).toFixed(2)}
            </Text>
          </View>

          {Number(order.discount) > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Product Discount</Text>
              <Text className="text-sm font-semibold text-green-600">
                -₹{Number(order.discount).toFixed(2)}
              </Text>
            </View>
          )}

          {Number(order.coupon_discount) > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Coupon Discount</Text>
              <Text className="text-sm font-semibold text-green-600">
                -₹{Number(order.coupon_discount).toFixed(2)}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-gray-600">Delivery Fee</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {order?.is_free_delivery ? (
                <Text className="text-green-600">Free</Text>
              ) : (
                `₹${Number(order.delivery_fee_paid_by_customer).toFixed(2)}`
              )}
            </Text>
          </View>

          {Number(order.tax) > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Tax</Text>
              <Text className="text-sm font-semibold text-gray-900">
                ₹{Number(order.tax).toFixed(2)}
              </Text>
            </View>
          )}

          <View className="h-px bg-gray-200 my-3" />

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Total Amount</Text>
            <Text className="text-lg font-bold text-gray-900">
              ₹{Number(order.total_amount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ── Special Instructions ──────────────────────────────────────── */}
        {order.special_instructions && (
          <View className="bg-blue-50 mx-4 rounded-2xl p-4 mb-3">
            <Text className="text-sm font-semibold text-blue-900 mb-1">
              Special Instructions
            </Text>
            <Text className="text-sm text-blue-700">{order.special_instructions}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Action Buttons ────────────────────────────────────────── */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <View className="flex-row gap-3">
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

          {canCancelOrder(order.status as OrderStatus) && (
            <TouchableOpacity
              onPress={() => setCancelModal(true)}
              className="flex-1 bg-red-50 border-2 border-red-300 rounded-xl py-4 items-center justify-center"
            >
              <Text className="text-red-600 font-bold text-base">Cancel Order</Text>
            </TouchableOpacity>
          )}

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
        </View>
      </View>

      {/* ── Cancel Order Modal ───────────────────────────────────────────── */}
      <Modal
        visible={cancelModal}
        transparent
        animationType="slide"
        onRequestClose={() => !cancelOrderMutation.isPending && setCancelModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            activeOpacity={1}
            onPress={() => !cancelOrderMutation.isPending && setCancelModal(false)}
          />

          {/* Sheet */}
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                <Feather name="x-circle" size={20} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Cancel Order</Text>
                <Text className="text-xs text-gray-500 mt-0.5">{order.order_number}</Text>
              </View>
            </View>

            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Why are you cancelling?
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-4">
              {CANCEL_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedReason === reason
                      ? 'bg-red-500 border-red-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedReason === reason ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedReason === 'Other' && (
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="Describe the reason..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                className="border border-gray-200 rounded-xl p-3 text-gray-900 text-sm mb-4"
                style={{ textAlignVertical: 'top', minHeight: 80 }}
              />
            )}

            <View className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 flex-row items-start gap-2">
              <Feather name="alert-triangle" size={14} color="#f97316" style={{ marginTop: 1 }} />
              <Text className="text-orange-700 text-xs leading-5 flex-1">
                Once cancelled, this action cannot be undone. If you paid online, a refund will be initiated.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleConfirmCancel}
              disabled={
                cancelOrderMutation.isPending ||
                !selectedReason ||
                (selectedReason === 'Other' && !customReason.trim())
              }
              className="bg-red-500 py-4 rounded-xl items-center justify-center mb-3"
              style={{
                opacity:
                  cancelOrderMutation.isPending ||
                  !selectedReason ||
                  (selectedReason === 'Other' && !customReason.trim())
                    ? 0.5
                    : 1,
              }}
            >
              {cancelOrderMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Confirm Cancellation</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCancelModal(false)}
              disabled={cancelOrderMutation.isPending}
              className="border-2 border-gray-200 py-4 rounded-xl items-center justify-center"
            >
              <Text className="text-gray-700 font-semibold text-base">Keep Order</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}