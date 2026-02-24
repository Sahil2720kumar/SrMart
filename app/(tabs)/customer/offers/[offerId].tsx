import FloatingCartBar from "@/components/FloatingCartBar"
import OfferProductCard from "@/components/OfferProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { Stack, useLocalSearchParams } from "expo-router"
import { FlatList, StatusBar, View, Text, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Image } from "expo-image"
import { useOfferDetail, useOfferProductsFetcher } from "@/hooks/queries"
import { blurhash } from "@/types/categories-products.types"

function getScopeLabel(offer: { applicable_to: string; applicable_id?: string | null }): string {
  switch (offer.applicable_to) {
    case "category": return "Category Offer"
    case "vendor":   return "Vendor Exclusive"
    case "product":  return "Selected Products"
    case "all":      return "Store-wide Offer"
    default:         return ""
  }
}

function formatEndDate(iso: string | null | undefined): string {
  if (!iso) return "Ongoing"
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function OfferScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>()

  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  const { data: offer, isLoading: isOfferLoading, error: offerError } = useOfferDetail(offerId ?? "")
  const { products, isLoading: isProductsLoading, error: productsError } = useOfferProductsFetcher(offer)

  if (isOfferLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-3 text-gray-500 text-sm">Loading offer…</Text>
      </SafeAreaView>
    )
  }

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

  const hasBanner = !!offer?.banner_image

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen options={{ headerTitle: offer?.title ?? "Offer" }} />

      {/* Offer banner card */}
      <View
        className="mx-4 mt-3 mb-2 rounded-2xl overflow-hidden"
        style={{ backgroundColor: offer?.bg_color ?? "#f3f4f6" }}
      >
        {/* Background image + scrim */}
        {hasBanner && (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
            <Image
              source={offer!.banner_image}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
              style={{ width: '100%', height: '100%',opacity:0.4 }}
            />
            <View style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
              backgroundColor: 'rgba(0,0,0,0.45)'
            }} />
          </View>
        )}

        {/* Content */}
        <View className="p-4 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            {offer?.tag && (
              <View className="self-start bg-white/30 px-2 py-0.5 rounded-full mb-1">
                <Text className="text-white text-xs font-semibold">{offer.tag}</Text>
              </View>
            )}
            <Text
              className="text-2xl font-bold"
              style={{ color: hasBanner ? '#ffffff' : '#1f2937' }}
            >
              {offer?.discount}
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: hasBanner ? 'rgba(255,255,255,0.85)' : '#4b5563' }}
            >
              {offer?.description ?? ""}
            </Text>
          </View>

          {/* Thumbnail */}
          <View className="w-16 h-16 rounded-xl overflow-hidden"
            style={{ backgroundColor: hasBanner ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' }}
          >
            {!hasBanner && (
              <View className="w-full h-full bg-gray-200 rounded-xl" />
            )}
          </View>
        </View>

        {/* Meta row */}
        <View className="flex-row items-center justify-between px-4 pb-4">
          <View className="flex-row items-center">
            <Text
              className="text-xs mr-2"
              style={{ color: hasBanner ? 'rgba(255,255,255,0.75)' : '#6b7280' }}
            >
              ⏱ {formatEndDate(offer?.end_date)}
            </Text>
            <Text
              className="text-xs"
              style={{ color: hasBanner ? 'rgba(255,255,255,0.75)' : '#6b7280' }}
            >
              {getScopeLabel(offer!)}
            </Text>
          </View>
          <View style={{ backgroundColor: hasBanner ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)' }}
            className="px-2 py-0.5 rounded-full"
          >
            <Text style={{ color: hasBanner ? '#ffffff' : '#4b5563' }} className="text-xs">
              {products.length} items
            </Text>
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

      <FloatingCartBar totalItems={totalItems} totalPrice={totalPrice} />
    </SafeAreaView>
  )
}