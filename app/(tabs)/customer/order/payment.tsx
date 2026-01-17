import { BlurView } from "expo-blur"
import { useFocusEffect, useSegments } from "expo-router"
import { router } from "expo-router"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native"

export default function PaymentScreen() {
  const [selectedPayment, setSelectedPayment] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const segments=useSegments()
  console.log("segments",segments);
  
  const handlePlaceOrder = () => {
    if (selectedPayment) {
      setShowSuccess(true)
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-lg font-bold text-gray-900 mb-6">Select Payment Method</Text>

        {/* COD Option */}
        <TouchableOpacity
          onPress={() => setSelectedPayment("cod")}
          className="flex-row items-center rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: selectedPayment === "cod" ? "#f0fdf4" : "#f9fafb",
            borderWidth: selectedPayment === "cod" ? 2 : 0,
            borderColor: selectedPayment === "cod" ? "#22c55e" : "transparent",
          }}
        >
          {/* Icon */}
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
            <Text style={{ fontSize: 24 }}>💵</Text>
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Cash on Delivery</Text>
            <Text className="text-xs text-gray-500 mt-1">Pay when you receive</Text>
          </View>

          {/* Radio Button */}
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
          className="flex-row items-center rounded-2xl p-5 mb-4"
          style={{
            backgroundColor: selectedPayment === "online" ? "#f0fdf4" : "#f9fafb",
            borderWidth: selectedPayment === "online" ? 2 : 0,
            borderColor: selectedPayment === "online" ? "#22c55e" : "transparent",
          }}
        >
          {/* Icon */}
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
            <Text style={{ fontSize: 24 }}>💳</Text>
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Pay Online</Text>
            <Text className="text-xs text-gray-500 mt-1">UPI, Card, Wallet & More</Text>
          </View>

          {/* Radio Button */}
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selectedPayment === "online" ? "#22c55e" : "#d1d5db",
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
      </ScrollView>

      {/* Bottom Place Order Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={!selectedPayment}
          className="rounded-2xl py-4 items-center justify-center"
          style={{
            backgroundColor: selectedPayment ? "#22c55e" : "#d1d5db",
          }}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">Place Order</Text>
        </TouchableOpacity>
      </View>

      {showSuccess && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
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
          <View className="bg-white rounded-3xl p-8 w-full" style={{ maxWidth: 400 }}>
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
              Order Place Successfully
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-8">
              You have successfully made order
            </Text>

            {/* View Order Status Button */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false)
                router.dismissAll(); // Clear all screens
                router.replace("/(tabs)/customer/order/orders/") // Go to orders
              }}
              className="bg-green-500 rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">View Order Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}