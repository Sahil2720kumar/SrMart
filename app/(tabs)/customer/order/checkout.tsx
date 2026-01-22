import CartItemComp from "@/components/CartItem"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import SkeletonImage from "@/components/SkeletonImage"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import useDiscountStore from "@/store/useDiscountStore"
import Feather from "@expo/vector-icons/Feather"
import { BlurView } from "expo-blur"
import { router } from "expo-router"
import { useState, useMemo, useRef } from "react"
import { View, Text, TouchableOpacity, ScrollView, Image, FlatList } from "react-native"

type CartItem = {
  id: string
  name: string
  weight: string
  price: number
  image?: string
}

type Address = {
  id: string
  label: string
  address: string
  isDefault: boolean
}

type PaymentMethod = {
  id: string
  name: string
  cardNumber: string
  type: string
}

const addresses: Address[] = [
  { id: "1", label: "Home", address: "6391 Elgin St. Celina, Delaware 10299", isDefault: true },
  { id: "2", label: "Office", address: "123 Business Ave. New York, NY 10001", isDefault: false },
  { id: "3", label: "Apartment", address: "456 Oak Lane. Los Angeles, CA 90001", isDefault: false },
]

const mockPayment: PaymentMethod = {
  id: "1",
  name: "Smith Watson",
  cardNumber: "6895 7852 5898 4200",
  type: "mastercard",
}

export default function CheckoutScreen() {
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()
  const {
    discountAmount,
    activeDiscount,
  } = useDiscountStore()

  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(addresses[0])

  const itemTotal = totalPrice
  const deliveryFee = itemTotal > 500 ? 0 : 40
  const grandTotal = Math.max(itemTotal + deliveryFee - discountAmount, 0)

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Item Details Section */}
        <View className="bg-white mt-2 px-4 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Item Details</Text>
            <View className="bg-green-50 px-3 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-semibold">{totalItems} Items</Text>
            </View>
          </View>

          <View className="mb-4">
            <FlatList
              data={cartItems}
              renderItem={({ item }) => <CartItemComp item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Delivery Address Section */}
        <View className="bg-white mt-2 px-4 py-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Delivery Address</Text>

          <View className="bg-gray-50 rounded-2xl p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-start flex-1">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Feather name="home" size={20} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900 mb-1">{selectedAddress.label}</Text>
                  <Text className="text-sm text-gray-600 leading-5">{selectedAddress.address}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAddressSheet(true)} className="ml-3">
                <View className="w-8 h-8 items-center justify-center">
                  <Feather name="edit-2" size={18} color="#16a34a" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Applied Coupon Section */}
        {activeDiscount && (
          <View className="bg-white mt-2 px-4 py-4">
            <Text className="text-base font-bold text-gray-900 mb-4">Applied Coupon</Text>

            <View className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4 border-2 border-green-200">
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
        <View className="bg-white mt-2 px-4 py-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Order Summary</Text>

          <View className="space-y-3">
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

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm text-gray-600">Delivery Fee</Text>
              <Text className={`text-sm font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}
              </Text>
            </View>

            {deliveryFee === 0 && (
              <View className="flex-row items-center mb-4 bg-green-50 rounded-lg p-2">
                <Feather name="gift" size={14} color="#16a34a" />
                <Text className="text-xs text-green-700 ml-2">
                  You got free delivery on this order!
                </Text>
              </View>
            )}

            <View className="h-px bg-gray-200 my-3" />

            <View className="flex-row justify-between items-center bg-gray-50 rounded-xl p-3">
              <Text className="text-base font-bold text-gray-900">Grand Total</Text>
              <Text className="text-lg font-bold text-green-600">₹{grandTotal.toFixed(2)}</Text>
            </View>

            {activeDiscount && (
              <View className="flex-row items-center justify-center mt-2">
                <Feather name="trending-down" size={16} color="#16a34a" />
                <Text className="text-xs text-green-700 ml-1 font-medium">
                  Total savings: ₹{(discountAmount).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Instructions */}
        <View className="bg-white mt-2 px-4 py-4">
          <View className="flex-row items-start bg-blue-50 rounded-xl p-3">
            <Feather name="info" size={16} color="#2563eb" className="mt-0.5" />
            <Text className="text-xs text-gray-700 ml-2 flex-1">
              You can select your preferred payment method on the next screen
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Pay Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4 border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xs text-gray-500">Total Amount</Text>
            <Text className="text-xl font-bold text-gray-900">₹{grandTotal.toFixed(2)}</Text>
          </View>
          {activeDiscount && (
            <View className="bg-green-50 px-3 py-1.5 rounded-full">
              <Text className="text-green-600 text-xs font-semibold">
                ₹{discountAmount.toFixed(0)} saved
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/customer/order/payment")}
          className="bg-green-500 rounded-2xl py-4 items-center justify-center shadow-lg flex-row"
        >
          <Text className="text-white font-bold text-base mr-2">Proceed to Payment</Text>
          <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {showAddressSheet && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Address Selection Bottom Sheet */}
      <SelectAddressBottomSheet
        isVisible={showAddressSheet}
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelectAddress={(address) => {
          setSelectedAddress(address)
          setShowAddressSheet(false)
        }}
        onClose={() => setShowAddressSheet(false)}
        onAddNewAddress={() => {
          setShowAddressSheet(false)
        }}
      />
    </View>
  )
}