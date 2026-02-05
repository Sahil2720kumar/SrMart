import { BlurView } from "expo-blur";
import { useSegments, router } from "expo-router";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import useDiscountStore from "@/store/useDiscountStore";
import { PaymentMethod } from "@/types/enums.types";
import { useAuthStore } from "@/store/authStore";
import useCartStore from "@/store/cartStore";
import { useCustomerAddresses, useCustomerProfile } from "@/hooks/queries";
import { useDeliveryFees } from "@/hooks/usedeliveryfees";
import { DeliveryFeeBreakdown } from "@/components/Deliveryfeebreakdown";

// Order structure that matches your SQL function
interface CreateOrderInput {
  vendor_id: string;
  delivery_address_id: string;
  coupon_id?: string | null;
  order_number: string;
  item_count: number;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  tax_percentage: number;
  discount: number;
  coupon_discount: number;
  total_amount: number;
  special_instructions?: string;
  distance_km: number;
  items: Array<{
    product_id: string;
    qty: number;
  }>;
}

export default function PaymentScreen() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | "">("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderGroupId, setOrderGroupId] = useState<string | null>(null);
  
  const segments = useSegments();
  
  // Zustand stores
  const { session } = useAuthStore();
  const { cartItems, totalPrice, clearCart } = useCartStore();
  const { activeDiscount, discountAmount } = useDiscountStore();
  
  console.log("segments", segments);

  // Get addresses and customer profile
  const { data: addresses, isLoading: isLoadingAddresses } = useCustomerAddresses(); 
  const { data: customerData, isLoading: isLoadingCustomer } = useCustomerProfile();
  const selectedAddress = addresses?.find((address) => address.is_default);

  // Use the delivery fees hook
  const {
    vendorDeliveryFees,
    totalDeliveryFee,
    originalDeliveryFee,
    vendorCount,
    isCalculating: isCalculatingDelivery,
    isFreeDelivery,
  } = useDeliveryFees({
    subtotal:totalPrice,
    selectedAddress,
    hasFreeDelivery: activeDiscount?.includes_free_delivery || false,
    freeDeliveryMinimum:499
  });

  // Constants
  const TAX_RATE = 0; // Tax is 0 for now

  // Prepare order data with calculated delivery fees
  const prepareOrderData = () => {
    // Group items by vendor
    const vendorMap = new Map<string, Array<{
      productId: string;
      product: any;
      quantity: number;
    }>>();

    cartItems.forEach((item) => {
      const vendorId = item.product?.vendor_id;
      if (!vendorId) return;

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, []);
      }
      vendorMap.get(vendorId)!.push(item);
    });

    // Create orders array with delivery fees
    const orders: CreateOrderInput[] = [];
    let groupSubtotal = 0;
    let groupDeliveryFee = 0;
    let groupTax = 0;

    vendorMap.forEach((items, vendorId) => {
      // Calculate order subtotal
      let orderSubtotal = 0;
      items.forEach((item) => {
        const price = item.product?.discount_price || item.product?.price || 0;
        orderSubtotal += price * item.quantity;
      });

      // Get delivery fee and distance for this vendor
      const vendorDeliveryInfo = vendorDeliveryFees.find(v => v.vendorId === vendorId);
      const orderDeliveryFee = vendorDeliveryInfo?.deliveryFee || 30; // Default to 30 if not found
      const orderDistance = vendorDeliveryInfo?.distance || 5; // Default to 5km if not found
      
      const orderTax = orderSubtotal * TAX_RATE;

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      orders.push({
        vendor_id: vendorId,
        delivery_address_id: selectedAddress!.id,
        coupon_id: null, // Coupon is handled at group level
        order_number: orderNumber,
        item_count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: orderSubtotal,
        delivery_fee: orderDeliveryFee,
        tax: orderTax,
        tax_percentage: TAX_RATE * 100,
        discount: 0,
        coupon_discount: 0, // Applied at group level
        total_amount: 0, // SQL function will calculate this
        special_instructions: "",
        distance_km: orderDistance,
        items: items.map((item) => ({
          product_id: item.productId,
          qty: item.quantity,
        })),
      });

      groupSubtotal += orderSubtotal;
      groupDeliveryFee += orderDeliveryFee;
      groupTax += orderTax;
    });

    return {
      orders,
      groupSubtotal,
      groupDeliveryFee,
      groupTax,
      groupDiscount: 0,
    };
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    if (!session?.user?.id) {
      Alert.alert("Error", "Please login to place order");
      router.replace("/auth/login");
      return;
    }

    if (!selectedAddress) {
      Alert.alert("Error", "Please select a delivery address");
      router.back();
      return;
    }

    if (!customerData) {
      Alert.alert("Error", "Customer profile not found");
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      router.back();
      return;
    }

    if (isCalculatingDelivery) {
      Alert.alert("Please wait", "Calculating delivery fees...");
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order data
      const {
        orders,
        groupSubtotal,
        groupDeliveryFee,
        groupTax,
        groupDiscount,
      } = prepareOrderData();

      if (orders.length === 0) {
        throw new Error("No valid items in cart");
      }

      // Map payment method
      const paymentMethod: PaymentMethod = selectedPayment === "online" ? "upi" : "cod";

      // Get coupon code from discount store
      const couponCode = activeDiscount?.code || null;

      console.log("Creating order with data:", {
        p_customer_id: customerData.user_id,
        p_payment_method: paymentMethod,
        p_coupon_code: couponCode,
        p_subtotal: groupSubtotal,
        p_tax: groupTax,
        p_delivery_fee: groupDeliveryFee,
        p_discount: groupDiscount,
        p_orders: orders,
      });

      // Create order group with orders
      const { data: groupId, error } = await supabase.rpc(
        "create_order_group_with_orders",
        {
          p_customer_id: customerData.user_id,
          p_payment_method: paymentMethod,
          p_coupon_code: couponCode,
          
          // Order group totals
          p_subtotal: groupSubtotal,
          p_tax: groupTax,
          // p_delivery_fee: groupDeliveryFee,
          p_discount: groupDiscount,
          
          // Orders array (one per vendor)
          p_orders: orders,
        }
      );

      if (error) {
        console.error("Order creation error:", error);
        throw new Error(error.message || "Failed to create order");
      }

      if (!groupId) {
        throw new Error("Order creation failed - no group ID returned");
      }

      setOrderGroupId(groupId);

      // Handle payment based on method
      if (selectedPayment === "online") {
        await handleOnlinePayment(groupId);
      } else if (selectedPayment === "cod") {
        // For COD, order is already created
        clearCart();
        setShowSuccess(true);
      }
    } catch (error: any) {
      console.error("Place order error:", error);
      Alert.alert(
        "Order Failed",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOnlinePayment = async (groupId: string) => {
    try {
      // Get order group total amount
      const { data: orderGroup, error: fetchError } = await supabase
        .from("order_groups")
        .select("total_amount")
        .eq("id", groupId)
        .single();

      if (fetchError || !orderGroup) {
        throw new Error("Failed to fetch order details");
      }

      // TODO: Implement Razorpay integration
      // For now, simulate success
      Alert.alert(
        "Payment Gateway",
        "Online payment integration coming soon. Order created with COD.",
        [
          {
            text: "OK",
            onPress: () => {
              clearCart();
              setShowSuccess(true);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Online payment error:", error);
      throw error;
    }
  };

  // Calculate final price after discount
  const finalPrice = activeDiscount 
    ? totalPrice - discountAmount
    : totalPrice;

  if (isLoadingAddresses || isLoadingCustomer) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Content */}
      <ScrollView
        className="flex-1 px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-lg font-bold text-gray-900 mb-6">
          Select Payment Method
        </Text>

        {/* Order Summary Card */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm font-semibold text-gray-900">
              ₹{totalPrice.toFixed(2)}
            </Text>
          </View>
          
          {activeDiscount && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-green-600">
                Discount ({activeDiscount.code})
              </Text>
              <Text className="text-sm font-semibold text-green-600">
                -₹{discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          
          {/* Delivery Fee Breakdown Component */}
          <DeliveryFeeBreakdown
            vendorDeliveryFees={vendorDeliveryFees}
            totalDeliveryFee={totalDeliveryFee}
            originalDeliveryFee={originalDeliveryFee}
            vendorCount={vendorCount}
            isCalculating={isCalculatingDelivery}
            isFreeDelivery={isFreeDelivery}
            showBreakdown={true}
          />
          
          <View className="border-t border-gray-200 my-2" />
          
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-gray-900">Total</Text>
            <Text className="text-base font-bold text-green-600">
              ₹{(finalPrice + totalDeliveryFee).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* COD Option */}
        <TouchableOpacity
          onPress={() => setSelectedPayment("cod")}
          disabled={isProcessing || isCalculatingDelivery}
          className="flex-row items-center rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: selectedPayment === "cod" ? "#f0fdf4" : "#f9fafb",
            borderWidth: selectedPayment === "cod" ? 2 : 0,
            borderColor: selectedPayment === "cod" ? "#22c55e" : "transparent",
            opacity: (isProcessing || isCalculatingDelivery) ? 0.6 : 1,
          }}
        >
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
            <Text style={{ fontSize: 24 }}>💵</Text>
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Cash on Delivery
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              Pay when you receive
            </Text>
          </View>

          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selectedPayment === "cod" ? "#22c55e" : "#d1d5db",
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedPayment === "cod" && (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#22c55e",
                }}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Pay Online Option */}
        <TouchableOpacity
          onPress={() => setSelectedPayment("online")}
          disabled={isProcessing || isCalculatingDelivery}
          className="flex-row items-center rounded-2xl p-5 mb-4"
          style={{
            backgroundColor:
              selectedPayment === "online" ? "#f0fdf4" : "#f9fafb",
            borderWidth: selectedPayment === "online" ? 2 : 0,
            borderColor: selectedPayment === "online" ? "#22c55e" : "transparent",
            opacity: (isProcessing || isCalculatingDelivery) ? 0.6 : 1,
          }}
        >
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
            <Text style={{ fontSize: 24 }}>💳</Text>
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              Pay Online
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              UPI, Card, Wallet & More
            </Text>
          </View>

          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor:
                selectedPayment === "online" ? "#22c55e" : "#d1d5db",
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedPayment === "online" && (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#22c55e",
                }}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Payment Info */}
        {selectedPayment && (
          <View className="bg-blue-50 rounded-2xl p-4 mt-4">
            <Text className="text-sm text-blue-900 font-medium">
              {selectedPayment === "cod"
                ? "💡 Pay with cash when your order is delivered to your doorstep"
                : "💡 Complete payment securely using UPI, Cards, or other payment methods"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Place Order Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={!selectedPayment || isProcessing || isCalculatingDelivery}
          className="rounded-2xl py-4 items-center justify-center flex-row"
          style={{
            backgroundColor:
              (selectedPayment && !isProcessing && !isCalculatingDelivery) ? "#22c55e" : "#d1d5db",
          }}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="white" size="small" className="mr-2" />
              <Text className="text-white font-bold text-base">
                Processing...
              </Text>
            </>
          ) : isCalculatingDelivery ? (
            <>
              <ActivityIndicator color="white" size="small" className="mr-2" />
              <Text className="text-white font-bold text-base">
                Calculating delivery...
              </Text>
            </>
          ) : (
            <Text className="text-white font-bold text-base">
              Place Order • ₹{(finalPrice + totalDeliveryFee).toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Blur overlay when processing */}
      {(showSuccess || isProcessing) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <View
            className="bg-white rounded-3xl p-8 w-full"
            style={{ maxWidth: 400 }}
          >
            {/* Success Icon */}
            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center">
                <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center">
                  <Text className="text-white text-4xl font-bold">✓</Text>
                </View>
              </View>
            </View>

            {/* Success Text */}
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Order Placed Successfully!
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-2">
              Your order has been confirmed
            </Text>
            {orderGroupId && (
              <Text className="text-xs text-gray-500 text-center mb-8">
                Order ID: {orderGroupId.substring(0, 8)}...
              </Text>
            )}

            {/* View Order Status Button */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                router.dismissAll();
                router.replace("/(tabs)/customer/order/orders/");
              }}
              className="bg-green-500 rounded-2xl py-4 items-center justify-center mb-3"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">
                View Order Status
              </Text>
            </TouchableOpacity>

            {/* Continue Shopping Button */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                router.dismissAll();
                router.replace("/customer");
              }}
              className="bg-gray-100 rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Continue Shopping
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}