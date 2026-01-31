import FloatingCartBar from "@/components/FloatingCartBar"
import OfferProductCard from "@/components/OfferProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { Stack, useLocalSearchParams } from "expo-router"
import { FlatList, StatusBar, View, Text, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useOfferDetail, useOfferProductsFetcher } from "@/hooks/queries"

// ─── label helpers ──────────────────────────────────────────────────────────

/** Human-readable scope label shown below the offer title */
function getScopeLabel(offer: { applicable_to: string; applicable_id?: string | null }): string {
  switch (offer.applicable_to) {
    case "category": return "Category Offer"
    case "vendor":   return "Vendor Exclusive"
    case "product":  return "Selected Products"
    case "all":      return "Store-wide Offer"
    default:         return ""
  }
}

/** End-date string or "Ongoing" */
function formatEndDate(iso: string | null | undefined): string {
  if (!iso) return "Ongoing"
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function OfferScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>()

  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  // 1. fetch the offer row
  const { data: offer, isLoading: isOfferLoading, error: offerError } = useOfferDetail(offerId ?? "")

  // 2. orchestrator — reads offer.applicable_to and enables the right query
  const { products, isLoading: isProductsLoading, error: productsError } = useOfferProductsFetcher(offer)

  // ── loading ───────────────────────────────────────────────────────────────
  if (isOfferLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-3 text-gray-500 text-sm">Loading offer…</Text>
      </SafeAreaView>
    )
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (offerError || productsError) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Text className="text-red-500 text-base text-center">Failed to load offer</Text>
        <Text className="text-gray-400 text-sm text-center mt-1">
          {offerError?.message ?? productsError?.message}
        </Text>
      </SafeAreaView>
    )
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen options={{ headerTitle: offer?.title ?? "Offer" }} />

      {/* Offer banner card */}
      <View
        className="mx-4 mt-3 mb-2 rounded-2xl p-4"
        style={{ backgroundColor: offer?.bg_color ?? "#f3f4f6" }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            {offer?.tag && (
              <View className="self-start bg-white/60 px-2 py-0.5 rounded-full mb-1">
                <Text className="text-gray-700 text-xs font-semibold">{offer.tag}</Text>
              </View>
            )}
            <Text className="text-2xl font-bold text-gray-800">{offer?.discount}</Text>
            <Text className="text-gray-600 text-sm mt-1">{offer?.description ?? ""}</Text>
          </View>
          {/* skeleton image placeholder */}
          <View className="w-16 h-16 bg-white/50 rounded-xl items-center justify-center">
            <View className="w-10 h-10 bg-gray-200 rounded-lg" />
          </View>
        </View>

        {/* meta row */}
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-xs mr-2">⏱ {formatEndDate(offer?.end_date)}</Text>
            <Text className="text-gray-500 text-xs">{getScopeLabel(offer!)}</Text>
          </View>
          <View className="bg-white/60 px-2 py-0.5 rounded-full">
            <Text className="text-gray-600 text-xs">{products.length} items</Text>
          </View>
        </View>
      </View>

      {/* Products Grid */}
      {isProductsLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="mt-2 text-gray-500 text-sm">Loading products…</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <OfferProductCard
              item={item}
              layoutMode="vertical"
              wishlist={wishlist}
              cart={cart}
              toggleWishlist={toggleWishlist}
              updateQuantity={updateQuantity}
              addToCart={addToCart}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingBottom: totalItems > 0 ? 100 : 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Text className="text-xl">📦</Text>
              </View>
              <Text className="text-gray-400 text-sm">No products in this offer</Text>
            </View>
          }
        />
      )}

      {/* Floating Cart Bar */}
      <FloatingCartBar totalItems={totalItems} totalPrice={totalPrice} />
    </SafeAreaView>
  )
}