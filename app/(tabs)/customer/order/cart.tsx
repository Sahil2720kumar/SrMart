import CartItemComp from "@/components/CartItem"
import OfferProductCard from "@/components/OfferProductCard"
import { DeliveryFeeBreakdown } from "@/components/Deliveryfeebreakdown"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import useDiscountStore from "@/store/useDiscountStore"
import { useDeliveryFees } from "@/hooks/usedeliveryfees"
import Feather from "@expo/vector-icons/Feather"
import { router, Stack } from "expo-router"
import { useCallback, useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import { BlurView } from "expo-blur"
import { useCustomerAddresses, useProducts } from "@/hooks/queries"
import { FullPageError } from "@/components/ErrorComp"

export default function CartScreen() {
  const { data: recommendedProducts = [], isLoading: isLoadingRecommendedProducts, isError: isErrorRecommendedProducts } = useProducts()
  const { data: addresses = [], isLoading: isLoadingAddresses, isError: isErrorAddresses } = useCustomerAddresses()
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()
  const {
    discountAmount,
    activeDiscount,
    removeDiscount,
  } = useDiscountStore()

  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(addresses.find(addr => addr.is_default) || addresses[0])

  // Update selected address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses.find(addr => addr.is_default) || addresses[0])
    }
  }, [addresses])

  // Use the delivery fees hook
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

  const handlePlaceOrder = useCallback(() => {
    router.navigate("/(tabs)/customer/order/checkout")
  }, []);

  const handleNavigateToCoupon = useCallback(() => {
    router.push("/customer/order/discount-coupon")
  }, []);

  if (isLoadingAddresses || isLoadingRecommendedProducts) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-gray-500 mt-4">Loading products...</Text>
      </View>
    )
  }

  if (isErrorAddresses || isErrorRecommendedProducts) {
    return (
      <FullPageError code="500" />
    )
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Cart Items */}
        <View className="mb-4">
          {cartItems.length === 0 ? (
            /* ---------- EMPTY CART ---------- */
            <View className="items-center justify-center py-16 px-6 bg-white rounded-2xl border border-gray-100">
              <Feather name="shopping-cart" size={56} color="#9ca3af" />

              <Text className="text-xl font-bold text-gray-900 mt-4">
                Your cart is empty
              </Text>

              <Text className="text-gray-500 text-sm text-center mt-2">
                Looks like you haven’t added anything yet.
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/customer')}
                activeOpacity={0.8}
                className="mt-6 bg-green-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-sm">
                  Start Shopping
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ---------- CART ITEMS ---------- */
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
          )}
        </View>


        {/* Before You Checkout */}
        <View className="px-4 mt-6 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-4">Before you Checkout</Text>
          <FlatList
            data={recommendedProducts}
            renderItem={({ item }) => (
              <OfferProductCard
                item={item}
                wishlist={wishlist}
                cart={cart}
                toggleWishlist={toggleWishlist}
                updateQuantity={updateQuantity}
                addToCart={addToCart}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          />
        </View>

        {/* Apply Coupon */}
        <TouchableOpacity
          onPress={handleNavigateToCoupon}
          className={`mx-4 mb-4 flex-row items-center rounded-2xl p-4 ${activeDiscount
            ? 'bg-green-50 border-2 border-green-500'
            : 'bg-white border border-green-500'
            }`}
        >
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${activeDiscount ? 'bg-green-500' : 'bg-green-100'
            }`}>
            {activeDiscount ? (
              <Feather name="check" size={16} color="white" />
            ) : (
              <Feather name="tag" size={16} color="#16a34a" />
            )}
          </View>

          <View className="flex-1">
            {activeDiscount ? (
              <>
                <Text className="text-sm font-semibold text-green-700">{activeDiscount.code} Applied</Text>
                <Text className="text-xs text-green-600 mt-0.5">You saved ₹{discountAmount.toFixed(2)}</Text>
              </>
            ) : (
              <Text className="text-base font-medium text-gray-900">APPLY COUPON</Text>
            )}
          </View>

          {activeDiscount ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                removeDiscount();
              }}
              className="mr-2"
            >
              <Feather name="x-circle" size={20} color="#16a34a" />
            </TouchableOpacity>
          ) : null}

          <Feather name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* Price Breakdown */}
        <View className="px-4 mb-4">
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

          {/* Delivery Fee Breakdown Component */}
          <DeliveryFeeBreakdown
            vendorDeliveryFees={vendorDeliveryFees}
            totalDeliveryFee={totalDeliveryFee}
            originalDeliveryFee={originalDeliveryFee}
            vendorCount={vendorCount}
            isCalculating={isCalculatingDelivery}
            isFreeDelivery={isFreeDelivery}
            showBreakdown={true}
            className="mb-3"
          />

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
                  You're saving ₹{discountAmount.toFixed(2)} on this order!
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Delivery Address */}
        <View className="px-4 mb-4">
          <TouchableOpacity onPress={() => setShowAddressSheet(true)} className="flex-row items-center justify-between bg-gray-50 rounded-2xl p-4">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3">
                <Feather name="home" size={24} color="#16a34a" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">Delivering to {selectedAddress?.label || 'Home'}</Text>
                <Text className="text-xs text-gray-500 mt-1">{selectedAddress?.address_line1 || 'Select address'}</Text>
              </View>
            </View>
            <View>
              <Text className="text-green-500 text-sm font-medium">Change</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handlePlaceOrder}
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
                Place Order • ₹{grandTotal.toFixed(2)}
              </Text>
              <Feather name="arrow-right" size={20} color="white" />
            </>
          )}
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