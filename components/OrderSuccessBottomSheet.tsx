import React, { useRef, useCallback } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"

interface OrderSuccessBottomSheetProps {
  isVisible: boolean
  orderId: string
  totalAmount: number
  itemCount: number
  onClose: () => void
  onContinueShopping: () => void
  onTrackOrder: () => void
}

export default function OrderSuccessBottomSheet({
  isVisible,
  orderId,
  totalAmount,
  itemCount,
  onClose,
  onContinueShopping,
  onTrackOrder,
}: OrderSuccessBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = [400]

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose()
      }
    },
    [onClose],
  )

  React.useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isVisible])

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      index={-1}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
        {/* Success Animation Circle */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-4">
            <View className="w-20 h-20 rounded-full bg-green-500 items-center justify-center">
              <Text className="text-white text-5xl">✓</Text>
            </View>
          </View>

          {/* Success Message */}
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Order Confirmed!</Text>
          <Text className="text-base text-gray-600 text-center mb-1">Your order has been placed successfully</Text>
          <Text className="text-sm text-gray-400">Order ID: {orderId}</Text>
        </View>

        {/* Order Summary Card */}
        <View className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-200">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Items Ordered</Text>
            <Text className="text-base font-semibold text-gray-900">{itemCount}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Total Amount</Text>
            <Text className="text-lg font-bold text-green-600">${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-200">
          <View className="flex-row items-start">
            <Text className="text-lg mr-3">🚚</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 mb-1">Estimated Delivery</Text>
              <Text className="text-sm text-gray-600">Tomorrow by 6:00 PM</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={onContinueShopping}
            className="flex-1 border-2 border-green-500 rounded-full py-3 items-center justify-center"
          >
            <Text className="text-green-600 font-semibold text-base">Continue Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onTrackOrder}
            className="flex-1 bg-green-500 rounded-full py-3 items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">Track Order</Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity onPress={onClose} className="items-center py-3">
          <Text className="text-gray-400 text-sm">Dismiss</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  )
}
