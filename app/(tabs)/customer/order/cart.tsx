import CartItemComp from "@/components/CartItem"
import OfferProductCard from "@/components/OfferProductCard"
import ProductCard from "@/components/ProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import Feather from "@expo/vector-icons/Feather"
import { router, Stack } from "expo-router"
import { useMemo, useCallback, useRef, useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, FlatList } from "react-native"
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Address } from "@/types/address.types"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import { BlurView } from "expo-blur"

type RecommendedProduct = {
  id: string
  name: string
  weight: string
  price: number
  originalPrice: number
}

const recommendedProducts: RecommendedProduct[] = [
  { id: "r1", name: "Surf Excel Easy Wash Detergent Power", weight: "500 ml", price: 12, originalPrice: 14 },
  { id: "r2", name: "Fortune Arhar Dal (Toor Dal)", weight: "1 kg", price: 10, originalPrice: 12 },
  { id: "r3", name: "Nescafe Clasico Coffee", weight: "200g", price: 8, originalPrice: 10 },
  { id: "r4", name: "Everest Kashmirila Red Chilli Powder", weight: "1 kg", price: 5, originalPrice: 8 },
]

const addresses: Address[] = [
  { id: "1", label: "Home", address: "6391 Elgin St. Celina, Delaware 10299", isDefault: true },
  { id: "2", label: "Office", address: "123 Business Ave. New York, NY 10001", isDefault: false },
  { id: "3", label: "Apartment", address: "456 Oak Lane. Los Angeles, CA 90001", isDefault: false },
]

export default function CartScreen() {
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [couponApplied, setCouponApplied] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(addresses[0])


  const itemTotal = totalPrice
  const deliveryFee = itemTotal > 50 ? 0 : 5
  const grandTotal = itemTotal + deliveryFee - discountAmount


  const handlePlaceOrder = useCallback(() => {
    router.navigate("/(tabs)/customer/order/checkout")
  }, []);

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        {/* Cart Items */}
        <View className="mb-4">
          <FlatList
            data={cartItems}
            renderItem={({ item }) => <CartItemComp item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}

            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Before You Checkout */}
        <View className="px-4 mt-6 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Before you Checkout</Text>
          <FlatList
            data={recommendedProducts}
            renderItem={({ item }) => <OfferProductCard item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}

            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerClassName="gap-4"
          />
        </View>

        {/* Apply Coupon */}
        <TouchableOpacity
          onPress={() => {
            setCouponApplied(!couponApplied)
            if (!couponApplied) setDiscountAmount(2)
          }}
          className="mx-4 mb-4 flex-row items-center bg-white border border-green-500 rounded-2xl p-4"
        >
          <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center mr-3">
            <Text className="text-white font-bold">✓</Text>
          </View>
          <Text className="text-base font-medium text-gray-900 flex-1">APPLY COUPON</Text>
          <Text className="text-gray-400">→</Text>
        </TouchableOpacity>

        {/* Price Breakdown */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-600">Item Total</Text>
            <Text className="text-gray-900 font-semibold">${itemTotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-600">Discount</Text>
            <Text className="text-gray-900 font-semibold">${discountAmount.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-600">Delivery</Text>
            <Text className={`font-semibold ${deliveryFee === 0 ? "text-green-500" : "text-gray-900"}`}>
              {deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          <View className="h-px bg-gray-200 mb-4" />
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Grand Total</Text>
            <Text className="text-base font-bold text-gray-900">${grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="px-4 mb-4">
          <TouchableOpacity onPress={() => setShowAddressSheet(true)} className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3">
                <Feather name="home" size={24} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">Delivering to {selectedAddress.label}</Text>
                <Text className="text-xs text-gray-500 mt-1">{selectedAddress.address}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text className="text-green-500 text-sm font-medium">Change</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          className="flex-row items-center bg-green-500 rounded-full px-6 py-4 justify-center"
        >
          <Text className="text-white font-semibold text-base mr-3">Place Order</Text>
          <Text className="text-white text-lg">→</Text>
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
