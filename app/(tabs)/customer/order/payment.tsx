import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  Alert, ActivityIndicator, Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { supabase } from "@/lib/supabase";
import useDiscountStore from "@/store/useDiscountStore";
import { PaymentMethod } from "@/types/enums.types";
import { useAuthStore } from "@/store/authStore";
import useCartStore from "@/store/cartStore";
import { useCustomerAddresses, useCustomerProfile } from "@/hooks/queries";
import { useDeliveryFees } from "@/hooks/usedeliveryfees";
import { DeliveryFeeBreakdown } from "@/components/Deliveryfeebreakdown";

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
  items: Array<{ product_id: string; qty: number }>;
}

const getRazorpayHTML = (
  keyId: string,
  razorpayOrderId: string,
  amount: number,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #loading { font-family: sans-serif; font-size: 14px; color: #9ca3af; }
  </style>
</head>
<body>
  <div id="loading">Opening payment...</div>
  <script>
    var isTestMode = "${keyId}".startsWith("rzp_test_");

    var options = {
      key: "${keyId}",
      amount: ${amount},
      currency: "INR",
      order_id: "${razorpayOrderId}",
      name: "Your Store",
      description: "Order Payment",
      prefill: {
        name: "${customerName}",
        contact: "${customerPhone}",
        email: "${customerEmail}",
        vpa: isTestMode ? "success@razorpay" : "",
      },
      theme: { color: "#22c55e" },
    
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "PAYMENT_SUCCESS",
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "PAYMENT_DISMISSED" }));
        },
        escape: false,
        backdropclose: false,
      }
    };

    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "PAYMENT_FAILED",
        error: response.error.description,
        code: response.error.code,
      }));
    });

    window.onload = function() {
      document.getElementById("loading").style.display = "none";
      rzp.open();
    };
  </script>
</body>
</html>
`;

export default function PaymentScreen() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | "">("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderGroupId, setOrderGroupId] = useState<string | null>(null);
  const [showRazorpayWebView, setShowRazorpayWebView] = useState(false);
  const [razorpayHTML, setRazorpayHTML] = useState("");
  const [isTestMode, setIsTestMode] = useState(false);

  const [pendingOrderData, setPendingOrderData] = useState<{
    orders: CreateOrderInput[];
    groupSubtotal: number;
    groupDeliveryFee: number;
    groupTax: number;
    groupDiscount: number;
    couponCode: string | null;
  } | null>(null);

  const { session } = useAuthStore();
  const { cartItems, totalPrice, clearCart } = useCartStore();
  const { activeDiscount, discountAmount } = useDiscountStore();

  const { data: addresses, isLoading: isLoadingAddresses } = useCustomerAddresses();
  const { data: customerData, isLoading: isLoadingCustomer } = useCustomerProfile();
  const selectedAddress = addresses?.find((address) => address.is_default);

  const {
    vendorDeliveryFees,
    totalDeliveryFee,
    originalDeliveryFee,
    vendorCount,
    isCalculating: isCalculatingDelivery,
    isFreeDelivery,
  } = useDeliveryFees({
    subtotal: totalPrice,
    selectedAddress,
    hasFreeDelivery: activeDiscount?.includes_free_delivery || false,
    freeDeliveryMinimum: 499,
  });

  const TAX_RATE = 0;
  const finalPrice = activeDiscount ? totalPrice - discountAmount : totalPrice;

  const prepareOrderData = () => {
    const vendorMap = new Map<string, Array<{ productId: string; product: any; quantity: number }>>();

    cartItems.forEach((item) => {
      const vendorId = item.product?.vendor_id;
      if (!vendorId) return;
      if (!vendorMap.has(vendorId)) vendorMap.set(vendorId, []);
      vendorMap.get(vendorId)!.push(item);
    });

    const orders: CreateOrderInput[] = [];
    let groupSubtotal = 0;
    let groupDeliveryFee = 0;
    let groupTax = 0;

    vendorMap.forEach((items, vendorId) => {
      let orderSubtotal = 0;
      items.forEach((item) => {
        const price = item.product?.discount_price || item.product?.price || 0;
        orderSubtotal += price * item.quantity;
      });

      const vendorDeliveryInfo = vendorDeliveryFees.find((v) => v.vendorId === vendorId);
      const orderDeliveryFee = vendorDeliveryInfo?.deliveryFee || 30;
      const orderDistance = vendorDeliveryInfo?.distance || 5;
      const orderTax = orderSubtotal * TAX_RATE;
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      orders.push({
        vendor_id: vendorId,
        delivery_address_id: selectedAddress!.id,
        coupon_id: null,
        order_number: orderNumber,
        item_count: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: orderSubtotal,
        delivery_fee: orderDeliveryFee,
        tax: orderTax,
        tax_percentage: TAX_RATE * 100,
        discount: 0,
        coupon_discount: 0,
        total_amount: 0,
        special_instructions: "",
        distance_km: orderDistance,
        items: items.map((item) => ({ product_id: item.productId, qty: item.quantity })),
      });

      groupSubtotal += orderSubtotal;
      groupDeliveryFee += orderDeliveryFee;
      groupTax += orderTax;
    });

    return { orders, groupSubtotal, groupDeliveryFee, groupTax, groupDiscount: 0 };
  };

  const createOrderInDB = async (orderData: typeof pendingOrderData) => {
    if (!orderData || !customerData) throw new Error("Missing order data");

    const { data: groupId, error } = await supabase.rpc("create_order_group_with_orders", {
      p_customer_id: customerData.user_id,
      p_payment_method: "online" as PaymentMethod,
      p_coupon_code: orderData.couponCode,
      p_subtotal: orderData.groupSubtotal,
      p_tax: orderData.groupTax,
      p_discount: orderData.groupDiscount,
      p_orders: orderData.orders,
    });

    if (error || !groupId) throw new Error(error?.message || "Failed to create order");
    return groupId;
  };

  const handlePlaceOrder = async () => {
    if (!selectedPayment) return Alert.alert("Error", "Please select a payment method");
    if (!session?.user?.id) { router.replace("/auth/login"); return; }
    if (!selectedAddress) { Alert.alert("Error", "Please select a delivery address"); router.back(); return; }
    if (!customerData) return Alert.alert("Error", "Customer profile not found");
    if (cartItems.length === 0) { router.back(); return; }
    if (isCalculatingDelivery) return Alert.alert("Please wait", "Calculating delivery fees...");

    setIsProcessing(true);

    try {
      const orderData = prepareOrderData();
      if (orderData.orders.length === 0) throw new Error("No valid items in cart");

      const couponCode = activeDiscount?.code || null;

      if (selectedPayment === "cod") {
        const { data: groupId, error } = await supabase.rpc("create_order_group_with_orders", {
          p_customer_id: customerData.user_id,
          p_payment_method: "cod" as PaymentMethod,
          p_coupon_code: couponCode,
          p_subtotal: orderData.groupSubtotal,
          p_tax: orderData.groupTax,
          p_discount: orderData.groupDiscount,
          p_orders: orderData.orders,
        });

        if (error || !groupId) throw new Error(error?.message || "Failed to create order");
        setOrderGroupId(groupId);
        clearCart();
        setShowSuccess(true);

      } else if (selectedPayment === "online") {
        const storedOrderData = { ...orderData, couponCode };
        setPendingOrderData(storedOrderData);
        await handleOpenRazorpay();
      }
    } catch (error: any) {
      Alert.alert("Order Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRazorpay = async () => {
    const totalToCharge = finalPrice + totalDeliveryFee;

    const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
      body: { amount: totalToCharge },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    if (error || !data?.razorpay_order_id) {
      throw new Error("Failed to initialize payment. Please try again.");
    }

    const { razorpay_order_id, amount, key_id } = data;

    // Track if test mode for UI hint
    setIsTestMode(key_id?.startsWith("rzp_test_") || false);

    const { data: userRecord } = await supabase
      .from("users")
      .select("phone, email")
      .eq("auth_id", session!.user.id)
      .single();

    const customerName = `${customerData!.first_name} ${customerData!.last_name}`;
    const customerPhone = userRecord?.phone || "";
    const customerEmail = userRecord?.email || session!.user.email || "";

    const html = getRazorpayHTML(
      key_id,
      razorpay_order_id,
      amount,
      customerName,
      customerPhone,
      customerEmail,
    );

    setRazorpayHTML(html);
    setShowRazorpayWebView(true);
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "PAYMENT_SUCCESS") {
        setShowRazorpayWebView(false);
        setIsProcessing(true);

        try {
          const groupId = await createOrderInDB(pendingOrderData);
          setOrderGroupId(groupId);
          clearCart();
          setPendingOrderData(null);
          setShowSuccess(true);
        } catch (err: any) {
          Alert.alert(
            "⚠️ Important",
            `Payment was successful but order creation failed. Please contact support with Payment ID: ${data.razorpay_payment_id}`,
          );
        } finally {
          setIsProcessing(false);
        }

      } else if (data.type === "PAYMENT_DISMISSED") {
        setShowRazorpayWebView(false);
        setPendingOrderData(null);
        Alert.alert("Payment Cancelled", "No order was placed. You can try again anytime.");

      } else if (data.type === "PAYMENT_FAILED") {
        setShowRazorpayWebView(false);
        setPendingOrderData(null);
        Alert.alert(
          "Payment Failed",
          data.error || "Payment could not be processed. Please try again.",
        );
      }
    } catch (e) {
      console.error("WebView message parse error", e);
    }
  };

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
      <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-bold text-gray-900 mb-6">Select Payment Method</Text>

        {/* Order Summary */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm font-semibold text-gray-900">₹{totalPrice.toFixed(2)}</Text>
          </View>
          {activeDiscount && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-green-600">Discount ({activeDiscount.code})</Text>
              <Text className="text-sm font-semibold text-green-600">-₹{discountAmount.toFixed(2)}</Text>
            </View>
          )}
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

        {/* COD */}
        <TouchableOpacity
          onPress={() => setSelectedPayment("cod")}
          disabled={isProcessing || isCalculatingDelivery}
          className="flex-row items-center rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: selectedPayment === "cod" ? "#f0fdf4" : "#f9fafb",
            borderWidth: selectedPayment === "cod" ? 2 : 0,
            borderColor: selectedPayment === "cod" ? "#22c55e" : "transparent",
            opacity: isProcessing || isCalculatingDelivery ? 0.6 : 1,
          }}
        >
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
            <Text style={{ fontSize: 24 }}>💵</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Cash on Delivery</Text>
            <Text className="text-xs text-gray-500 mt-1">Pay when you receive</Text>
          </View>
          <View style={{
            width: 24, height: 24, borderRadius: 12, borderWidth: 2,
            borderColor: selectedPayment === "cod" ? "#22c55e" : "#d1d5db",
            backgroundColor: "white", alignItems: "center", justifyContent: "center",
          }}>
            {selectedPayment === "cod" && (
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#22c55e" }} />
            )}
          </View>
        </TouchableOpacity>

        {/* Pay Online */}
        <TouchableOpacity
          onPress={() => setSelectedPayment("online")}
          disabled={isProcessing || isCalculatingDelivery}
          className="flex-row items-center rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: selectedPayment === "online" ? "#f0fdf4" : "#f9fafb",
            borderWidth: selectedPayment === "online" ? 2 : 0,
            borderColor: selectedPayment === "online" ? "#22c55e" : "transparent",
            opacity: isProcessing || isCalculatingDelivery ? 0.6 : 1,
          }}
        >
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
            <Text style={{ fontSize: 24 }}>💳</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Pay Online</Text>
            <Text className="text-xs text-gray-500 mt-1">UPI, Card, Wallet & More</Text>
          </View>
          <View style={{
            width: 24, height: 24, borderRadius: 12, borderWidth: 2,
            borderColor: selectedPayment === "online" ? "#22c55e" : "#d1d5db",
            backgroundColor: "white", alignItems: "center", justifyContent: "center",
          }}>
            {selectedPayment === "online" && (
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#22c55e" }} />
            )}
          </View>
        </TouchableOpacity>

        {selectedPayment && (
          <View className="bg-blue-50 rounded-2xl p-4 mt-4">
            <Text className="text-sm text-blue-900 font-medium">
              {selectedPayment === "cod"
                ? "💡 Pay with cash when your order is delivered to your doorstep"
                : "💡 Secured by Razorpay. Supports UPI, Cards, Net Banking & Wallets"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Place Order Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={!selectedPayment || isProcessing || isCalculatingDelivery}
          className="rounded-2xl py-4 items-center justify-center flex-row"
          style={{
            backgroundColor: selectedPayment && !isProcessing && !isCalculatingDelivery
              ? "#22c55e" : "#d1d5db",
          }}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-base">Processing...</Text>
            </>
          ) : isCalculatingDelivery ? (
            <>
              <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-base">Calculating delivery...</Text>
            </>
          ) : (
            <Text className="text-white font-bold text-base">
              Place Order • ₹{(finalPrice + totalDeliveryFee).toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay WebView Modal — Full Screen */}
      {/* Razorpay WebView Modal — Full Screen */}
      <Modal
        visible={showRazorpayWebView}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setShowRazorpayWebView(false);
          setPendingOrderData(null);
          Alert.alert("Payment Cancelled", "No order was placed.");
        }}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>

          {/* Processing overlay */}
          {isProcessing && (
            <View style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center", justifyContent: "center",
              zIndex: 20,
            }}>
              <View style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 28,
                alignItems: "center",
                marginHorizontal: 48,
              }}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginTop: 14 }}>
                  Confirming Order...
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Please don't close the app
                </Text>
              </View>
            </View>
          )}

          {/* Test mode banner — only shows in test mode */}
          {!isTestMode && (
            <View style={{
              backgroundColor: "#fef9c3",
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#fef08a",
            }}>
              <Text style={{ fontSize: 12 }}>⚠️</Text>
              <Text style={{ fontSize: 11, color: "#854d0e", fontWeight: "600", flex: 1 }}>
                Test Mode · Use UPI ID: success@razorpay
              </Text>
            </View>
          )}

          {/* WebView — takes all remaining space */}
          <WebView
            source={{ html: razorpayHTML }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            originWhitelist={[
              "https://*", "http://*",
              "gpay://*", "phonepe://*", "paytmmp://*",
              "upi://*", "bhim://*", "tez://*",
            ]}
            style={{ flex: 1 }}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              const upiSchemes = [
                "gpay://", "phonepe://", "paytmmp://",
                "bhim://", "upi://", "tez://",
                "credpay://", "mobikwik://", "freecharge://",
              ];
              const isUpiLink = upiSchemes.some((scheme) => url.startsWith(scheme));
              if (isUpiLink) {
                if (isTestMode) {
                  Alert.alert(
                    "Test Mode",
                    "UPI apps don't work in test mode.\nUse UPI ID: success@razorpay",
                    [{ text: "Got it" }]
                  );
                  return false;
                }
                Linking.openURL(url).catch(console.error);
                return false;
              }
              return true;
            }}
            onError={(syntheticEvent) => {
              if (syntheticEvent.nativeEvent.code === -10) return;
              console.error("WebView error:", syntheticEvent.nativeEvent);
            }}
          />
        </View>
      </Modal>

      {/* COD processing blur */}
      {isProcessing && !showRazorpayWebView && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-white rounded-3xl p-8 w-full" style={{ maxWidth: 400 }}>
            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center">
                <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center">
                  <Text className="text-white text-4xl font-bold">✓</Text>
                </View>
              </View>
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Order Placed!
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-2">
              Your order has been confirmed
            </Text>
            {orderGroupId && (
              <Text className="text-xs text-gray-500 text-center mb-8">
                Order ID: {orderGroupId.substring(0, 8)}...
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                router.dismissAll();
                router.replace("/(tabs)/customer/order/order-groups");
              }}
              className="bg-green-500 rounded-2xl py-4 items-center justify-center mb-3"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">View Order Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                router.dismissAll();
                router.replace("/customer");
              }}
              className="bg-gray-100 rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 font-semibold text-base">Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}