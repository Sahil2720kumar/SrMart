import CartItemComp from "@/components/CartItem"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import { DeliveryFeeBreakdown } from "@/components/Deliveryfeebreakdown"
import { FullPageError } from "@/components/ErrorComp"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import useDiscountStore from "@/store/useDiscountStore"
import { useDeliveryFees } from "@/hooks/usedeliveryfees"
import Feather from "@expo/vector-icons/Feather"
import { BlurView } from "expo-blur"
import { router, Stack } from "expo-router"
import { useState, useCallback, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native"
import { useCustomerAddresses } from "@/hooks/queries"

export default function CheckoutScreen() {
  const { data: addresses = [], isLoading: isLoadingAddresses, isError: isErrorAddresses } = useCustomerAddresses()
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()
  const { discountAmount, activeDiscount } = useDiscountStore()

  // Layout already called useCartPriceSync — just read the flag from the store
  const isSyncingPrices = useCartStore((s) => s.isSyncingPrices)

  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(addresses.find(addr => addr.is_default) || addresses[0])

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses.find(addr => addr.is_default) || addresses[0])
    }
  }, [addresses])

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
    freeDeliveryMinimum: 499
  })

  const itemTotal = totalPrice
  const grandTotal = Math.max(itemTotal + totalDeliveryFee - discountAmount, 0)

  const handleProceedToPayment = useCallback(() => {
    router.navigate("/(tabs)/customer/order/payment")
  }, [])

  if (isLoadingAddresses || isSyncingPrices) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </View>
    )
  }

  if (isErrorAddresses) {
    return <FullPageError code="500" />
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Item Details Section */}
        <View className="px-4 mt-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-gray-900">Item Details</Text>
            <View className="bg-green-50 px-3 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-semibold">{totalItems} Items</Text>
            </View>
          </View>

          <FlatList
            data={cartItems}
            renderItem={({ item }) => (
              <CartItemComp
                item={item}
                wishlist={wishlist}
                cart={cart}
                toggleWishlist={toggleWishlist}
                updateQuantity={updateQuantity}
                addToCart={addToCart}
              />
            )}
            keyExtractor={(item) => item.productId}
            scrollEnabled={false}
          />
        </View>

        {/* Delivery Address Section */}
        <View className="px-4 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Delivery Address</Text>

          <TouchableOpacity
            onPress={() => setShowAddressSheet(true)}
            className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3">
                <Feather name="home" size={24} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  Delivering to {selectedAddress?.label || 'Home'}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {selectedAddress?.address_line1 || 'Select address'}
                </Text>
              </View>
            </View>
            <Text className="text-green-500 text-sm font-medium">Change</Text>
          </TouchableOpacity>
        </View>

        {/* Applied Coupon Section */}
        {activeDiscount && (
          <View className="px-4 mb-4">
            <Text className="text-base font-bold text-gray-900 mb-4">Applied Coupon</Text>

            <View className="bg-green-50 rounded-2xl p-4 border-2 border-green-200">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center mr-3">
                  <Feather name="check" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-green-700">{activeDiscount.code}</Text>
                  <Text className="text-sm text-green-600 mt-0.5">
                    You saved ₹{discountAmount.toFixed(2)} on this order
                  </Text>
                </View>
                <View className="bg-white rounded-full px-3 py-1.5">
                  <Text className="text-green-600 font-bold text-sm">-₹{discountAmount.toFixed(0)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary Section */}
        <View className="px-4 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Order Summary</Text>

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm text-gray-600">Item Total</Text>
            <Text className="text-sm font-semibold text-gray-900">₹{itemTotal.toFixed(2)}</Text>
          </View>

          {activeDiscount && (
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-sm text-green-600">Discount</Text>
                <View className="ml-2 bg-green-100 px-2 py-0.5 rounded">
                  <Text className="text-green-700 text-xs font-semibold">{activeDiscount.code}</Text>
                </View>
              </View>
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
            className="mb-4"
          />

          {totalDeliveryFee === 0 && (
            <View className="mb-4 bg-green-50 rounded-lg p-2">
              <View className="flex-row items-center">
                <Feather name="gift" size={14} color="#16a34a" />
                <Text className="text-xs text-green-700 ml-1 font-medium">
                  You got free delivery on this order!
                </Text>
              </View>
            </View>
          )}

          <View className="h-px bg-gray-200 mb-4" />

          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Grand Total</Text>
            <Text className="text-base font-bold text-gray-900">₹{grandTotal.toFixed(2)}</Text>
          </View>

          {activeDiscount && (
            <View className="mt-2 bg-green-50 rounded-lg p-2">
              <View className="flex-row items-center">
                <Feather name="gift" size={14} color="#16a34a" />
                <Text className="text-xs text-green-700 ml-1 font-medium">
                  Total savings: ₹{discountAmount.toFixed(2)} on this order!
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Instructions */}
        <View className="px-4 mb-4">
          <View className="flex-row items-start bg-blue-50 rounded-xl p-3">
            <Feather name="info" size={16} color="#2563eb" className="mt-0.5" />
            <Text className="text-xs text-gray-700 ml-2 flex-1">
              You can select your preferred payment method on the next screen
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Proceed to Payment Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleProceedToPayment}
          disabled={isCalculatingDelivery}
          className="flex-row items-center bg-green-500 rounded-full px-6 py-4 justify-center"
          style={{ opacity: isCalculatingDelivery ? 0.6 : 1 }}
        >
          {isCalculatingDelivery ? (
            <>
              <ActivityIndicator color="white" size="small" className="mr-3" />
              <Text className="text-white font-semibold text-base">
                Calculating delivery...
              </Text>
            </>
          ) : (
            <>
              <Text className="text-white font-semibold text-base mr-3">
                Proceed to Payment • ₹{grandTotal.toFixed(2)}
              </Text>
              <Feather name="arrow-right" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {showAddressSheet && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      <SelectAddressBottomSheet
        isVisible={showAddressSheet}
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelectAddress={(address) => {
          setSelectedAddress(address)
          setShowAddressSheet(false)
        }}
        onClose={() => setShowAddressSheet(false)}
        onAddNewAddress={() => setShowAddressSheet(false)}
      />
    </View>
  )
}