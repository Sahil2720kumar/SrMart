// app/(tabs)/vendor/orders/[orderId].tsx (CORRECTED VERSION)
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  useOrderDetail,
  useVendorAcceptOrder,
  useVendorRejectOrder,
  useMarkOrderReady,
  useAssignDeliveryPartner,
  useAvailableDeliveryPartners,
} from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import { DeliveryBoy } from '@/types/users.types';
import { Image } from 'expo-image';
import { blurhash } from '@/types/categories-products.types';
import SelectDeliveryPartnerBottomSheet from '@/components/SelectDeliveryPartnerBottomSheet ';
import RejectOrderModal from '@/components/RejectOrderModal';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-500' },
  confirmed: { label: 'New', color: 'bg-orange-500' },
  processing: { label: 'Preparing', color: 'bg-blue-500' },
  ready_for_pickup: { label: 'Ready', color: 'bg-purple-500' },
  picked_up: { label: 'Picked Up', color: 'bg-indigo-500' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-500' },
  delivered: { label: 'Completed', color: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
  refunded: { label: 'Refunded', color: 'bg-pink-500' },
};

export default function VendorOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { session } = useAuthStore();
  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<DeliveryBoy | null>(null);

  // Queries
  const { data: order, isLoading, error } = useOrderDetail(orderId);
  const { data: deliveryPartners } = useAvailableDeliveryPartners(
    order?.vendors
      ? { latitude: order.vendors.latitude || 0, longitude: order.vendors.longitude || 0 }
      : undefined
  );

  // Mutations
  const acceptMutation = useVendorAcceptOrder();
  const rejectMutation = useVendorRejectOrder();
  const markReadyMutation = useMarkOrderReady();
  const assignPartnerMutation = useAssignDeliveryPartner();

  const handleAcceptOrder = () => {
    Alert.alert('Accept Order', 'Are you sure you want to accept this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () => {
          acceptMutation.mutate(orderId, {
            onSuccess: () => {
              Alert.alert('Success', 'Order accepted successfully!');
            },
            onError: (error: any) => {
              Alert.alert('Error', error.message);
            },
          });
        },
      },
    ]);
  };

  const handleRejectOrder = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = (reason: string) => {
    rejectMutation.mutate(
      { orderId, reason },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Order rejected. Customer has been notified.', [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]);
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to reject order');
        },
      }
    );
  };

  const handleMarkReady = () => {
    Alert.alert('Mark as Ready', 'Is the order ready for pickup?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Ready',
        onPress: () => {
          markReadyMutation.mutate(orderId, {
            onSuccess: () => {
              Alert.alert('Success', 'Order marked as ready!');
            },
            onError: (error: any) => {
              Alert.alert('Error', error.message);
            },
          });
        },
      },
    ]);
  };

  const handleAssignPartner = () => {
    if (!selectedPartner) {
      Alert.alert('Error', 'Please select a delivery partner');
      return;
    }

    assignPartnerMutation.mutate(
      { orderId, deliveryBoyId: selectedPartner.user_id },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Delivery partner assigned!');
          setShowDeliverySheet(false);
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message);
        },
      }
    );
  };

  const handleCallCustomer = () => {
    if (order?.customers) {
      // You'll need to add phone to customers table or users table
      Linking.openURL(`tel:+91XXXXXXXXXX`);
    }
  };

  const getActionButtons = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'pending':
        return [
          {
            label: 'Accept Order',
            style: 'bg-emerald-500',
            action: handleAcceptOrder,
            loading: acceptMutation.isPending,
          },
          {
            label: 'Reject Order',
            style: 'bg-red-500',
            action: handleRejectOrder,
            loading: rejectMutation.isPending,
          },
        ];
      case 'processing':
        return [
          {
            label: 'Mark as Ready',
            style: 'bg-purple-500',
            action: handleMarkReady,
            loading: markReadyMutation.isPending,
          },
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Text className="text-red-600 text-center mb-4">
          Error loading order details
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-green-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const config = statusConfig[order.status as keyof typeof statusConfig];
  const actions = getActionButtons(order.status);
  const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Calculate vendor-specific amounts
  const totalCommission = order.order_items?.reduce(
    (sum, item) => sum + (item.commission_amount || 0),
    0
  ) || 0;

  // Vendor receives: Item subtotal - vendor's product discount - platform commission
  // Vendor does NOT pay for coupon discount or delivery fee
  const itemsTotal = order.order_items?.reduce(
    (sum, item) => sum + item.total_price,
    0
  ) || 0;
  
  const vendorPayout = itemsTotal - totalCommission;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Order Details',
          headerBackTitle: 'Orders',
        }}
      />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{order.order_number}</Text>
          <Text className="text-sm text-gray-600 mt-1">
            {new Date(order.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View className={`${config.color} rounded-full px-3 py-2`}>
          <Text className="text-white text-xs font-semibold">{config.label}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Order Summary */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">ORDER SUMMARY</Text>

          <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
            <Text className="text-gray-600 text-sm">Payment Method</Text>
            <Text
              className={`font-semibold text-sm ${
                order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
              }`}
            >
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
            <Text className="text-gray-600 text-sm">Customer Pays</Text>
            <Text className="text-base font-bold text-gray-900">
              ₹{order.total_amount.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center pt-3">
            <Text className="text-green-700 text-sm font-semibold">You Receive</Text>
            <Text className="text-2xl font-bold text-green-600">
              ₹{vendorPayout.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">CUSTOMER INFO</Text>

          <View className="flex-row items-center pb-3 border-b border-gray-100 mb-3">
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3 overflow-hidden">
              {order.customers?.profile_image ? (
                <Image
                  source={order.customers?.profile_image}
                  placeholder={{ blurhash: blurhash }}
                  contentFit="cover"
                  transition={1000}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text className="text-2xl">👤</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm">
                {order.customers?.first_name} {order.customers?.last_name}
              </Text>
              <Text className="text-gray-600 text-xs mt-1">Customer</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleCallCustomer}
            className="flex-row items-center gap-3 bg-blue-50 rounded-xl p-3"
          >
            <Feather name="phone" size={18} color="#2563eb" />
            <Text className="text-blue-700 font-semibold text-sm flex-1">
              Call Customer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">
            DELIVERY ADDRESS
          </Text>

          <View className="flex-row items-start gap-2">
            <Feather name="map-pin" size={18} color="#6b7280" className="mt-1" />
            <View className="flex-1">
              <Text className="text-gray-600 text-xs mb-1">
                {order.customer_addresses?.label || 'Home'}
              </Text>
              <Text className="text-gray-900 font-semibold text-sm leading-5">
                {order.customer_addresses?.address_line1}
                {order.customer_addresses?.address_line2 &&
                  `, ${order.customer_addresses.address_line2}`}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {order.customer_addresses?.city}, {order.customer_addresses?.state} -{' '}
                {order.customer_addresses?.pincode}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">
            ITEMS ({totalItems})
          </Text>

          {order.order_items?.map((item, index) => (
            <View
              key={item.id}
              className={`flex-row items-center py-3 ${
                index !== order.order_items!.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* Product Image */}
              <View className="w-14 h-14 bg-gray-100 rounded-xl mr-3 overflow-hidden">
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
                <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
                  {item.product_name}
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  ₹{item.discount_price || item.unit_price} × {item.quantity}
                </Text>
                {item.commission_rate && (
                  <Text className="text-orange-600 text-xs mt-0.5">
                    Commission: {item.commission_rate}%
                  </Text>
                )}
              </View>

              {/* Total */}
              <View className="items-end">
                <Text className="text-gray-900 font-bold text-sm">
                  ₹{item.total_price.toFixed(2)}
                </Text>
                {item.commission_amount && item.commission_amount > 0 && (
                  <Text className="text-orange-600 text-xs mt-0.5">
                    -₹{item.commission_amount.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Partner Assignment */}
        {(order.status === 'processing' || order.status === 'ready_for_pickup') && (
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">
              DELIVERY PARTNER
            </Text>

            {order.delivery_boys ? (
              <View className="flex-row items-center py-2">
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-2xl">🚴</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-sm">
                    {order.delivery_boys.first_name} {order.delivery_boys.last_name}
                  </Text>
                  <Text className="text-gray-600 text-xs">Assigned</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowDeliverySheet(true)}
                className="bg-green-50 border border-green-200 rounded-xl p-3 flex-row items-center justify-center gap-2"
              >
                <Feather name="truck" size={18} color="#059669" />
                <Text className="text-green-700 font-semibold text-sm">
                  Assign Delivery Partner
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Vendor Earnings Breakdown */}
        <View className="bg-white mx-4 mt-4 mb-6 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">
            YOUR EARNINGS
          </Text>

          <View className="space-y-2 pb-3 border-b border-gray-100">
            <View className="flex-row justify-between py-1">
              <Text className="text-gray-600 text-sm">Items Total</Text>
              <Text className="text-gray-900 font-semibold text-sm">
                ₹{itemsTotal.toFixed(2)}
              </Text>
            </View>

            {order.discount > 0 && (
              <View className="flex-row justify-between py-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-gray-600 text-sm">Your Product Discount</Text>
                  <Feather name="info" size={12} color="#9ca3af" />
                </View>
                <Text className="text-orange-600 font-semibold text-sm">
                  -₹{order.discount.toFixed(2)}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between py-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-gray-600 text-sm">Platform Commission</Text>
                <Feather name="info" size={12} color="#9ca3af" />
              </View>
              <Text className="text-red-600 font-semibold text-sm">
                -₹{totalCommission.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between pt-3 bg-green-50 -mx-4 -mb-4 px-4 py-4 rounded-b-2xl">
            <Text className="text-green-700 font-bold text-base">Your Payout</Text>
            <Text className="text-green-700 font-bold text-xl">
              ₹{vendorPayout.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Info Card - What's not included */}
        <View className="bg-blue-50 mx-4 mb-6 rounded-2xl p-4 border border-blue-200">
          <View className="flex-row items-start gap-3">
            <Feather name="info" size={18} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-blue-900 font-semibold text-sm mb-2">
                Note on Customer's Total
              </Text>
              <Text className="text-blue-700 text-xs leading-5">
                Customer paid ₹{order.total_amount.toFixed(2)}, which includes delivery fees (₹
                {order.delivery_fee.toFixed(2)}) and platform coupons (₹
                {order.coupon_discount.toFixed(2)}) that are not deducted from your earnings.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <View className="bg-white px-4 py-4 border-t border-gray-200">
          <View className="flex-row gap-3">
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.action}
                disabled={action.loading}
                className={`flex-1 ${action.style} rounded-xl py-4 items-center justify-center`}
                style={{ opacity: action.loading ? 0.6 : 1 }}
              >
                {action.loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">{action.label}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Modals */}
      {(showDeliverySheet || showRejectModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      <RejectOrderModal
        visible={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        isLoading={rejectMutation.isPending}
        orderNumber={order?.order_number}
      />

      <SelectDeliveryPartnerBottomSheet
        isVisible={showDeliverySheet}
        partners={deliveryPartners || []}
        selectedPartner={selectedPartner}
        onSelectPartner={setSelectedPartner}
        onClose={() => setShowDeliverySheet(false)}
        onConfirm={handleAssignPartner}
        isLoading={assignPartnerMutation.isPending}
      />
    </SafeAreaView>
  );
}