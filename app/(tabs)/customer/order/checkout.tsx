import CartItemComp from "@/components/CartItem"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import SkeletonImage from "@/components/SkeletonImage"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
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
  name: string
  address: string
  isDefault: boolean
}

type PaymentMethod = {
  id: string
  name: string
  cardNumber: string
  type: string
}

const mockCartItems: CartItem[] = [
  { id: "1", name: "Fortune Sun Lite Refined Sunflower Oil", weight: "5 L", price: 12 },
  { id: "2", name: "Aashirvaad Shudh Aata", weight: "10 kg", price: 12 },
]

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

  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(addresses[0])



  const discount = 2
  const deliveryFee = 0


  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Item Details Section */}
        <View className="bg-white mt-2 px-4 py-4">
          <Text className="text-lg font-bold text-gray-900 mb-4">Item Details</Text>

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
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900 mb-2">{selectedAddress.label}</Text>
                <Text className="text-sm text-gray-600 leading-5">{selectedAddress.address}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddressSheet(true)} className="ml-3">
                <View className="w-8 h-8 items-center justify-center">
                  <Feather name="edit" size={20} color="#10b981" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Details Section */}


        {/* Order Summary Section */}
        <View className="bg-white mt-2 px-4 py-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Order Summary</Text>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-gray-600">Item Total</Text>
              <Text className="text-sm font-semibold text-gray-900">${totalPrice}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-gray-600">Discount</Text>
              <Text className="text-sm font-semibold text-gray-900">${discount}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm text-green-600 font-medium">Delivery Free</Text>
              <Text className="text-sm font-semibold text-green-600">Free</Text>
            </View>

            <View className="h-px bg-gray-200 my-3" />

            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-gray-900">Grand Total</Text>
              <Text className="text-lg font-bold text-gray-900">${totalPrice - discount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Pay Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4 border-t border-gray-100">
        <TouchableOpacity onPress={()=>router.navigate("/(tabs)/customer/order/payment")} className="bg-green-500 rounded-2xl py-4 items-center justify-center shadow-lg">
          <Text className="text-white font-bold text-base">Pay Now</Text>
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