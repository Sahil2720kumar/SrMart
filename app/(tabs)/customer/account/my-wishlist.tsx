import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native"
import { Stack, router } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import useWishlistStore from "@/store/wishlistStore"
import useCartStore from "@/store/cartStore"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import ProductCard from "@/components/ProductCard"

// ── fetch products by ids ────────────────────────────────────────────────────
function useWishlistProducts(ids: string[]) {  
  return useQuery({
    queryKey: ["wishlist-products", ids],
    queryFn: async () => {
      if (ids.length === 0) return []
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", ids)
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export default function WishlistScreen() {
  const { wishlistItems, wishlist, toggleWishlist, clearWishlist } = useWishlistStore()
  const { cart, addToCart, updateQuantity } = useCartStore()

  const { data: products = [], isLoading } = useWishlistProducts(wishlistItems)

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-gray-500 mt-4">Loading wishlist...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true, title: "Wishlist",headerTitleAlign:"center" }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Wishlist Items */}
        <View className="mb-4">
          {wishlistItems.length === 0 ? (
            /* ---------- EMPTY WISHLIST ---------- */
            <View className="items-center justify-center py-16 px-6 bg-white rounded-2xl border border-gray-100 mx-4 mt-4">
              <Feather name="heart" size={56} color="#9ca3af" />
              <Text className="text-xl font-bold text-gray-900 mt-4">
                Your wishlist is empty
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Save items you love and add them to cart when you're ready.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/customer")}
                activeOpacity={0.8}
                className="mt-6 bg-green-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-sm">
                  Start Shopping
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ---------- WISHLIST ITEMS ---------- */
            <>
              {/* Header row with count + clear */}
              <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
                <Text className="text-sm text-gray-500">
                  {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
                </Text>
                <TouchableOpacity
                  onPress={clearWishlist}
                  className="flex-row items-center gap-1"
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={14} color="#ef4444" />
                  <Text className="text-red-500 text-sm font-medium">Clear all</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={{ paddingHorizontal: 12, gap: 8,marginTop:10 }}
                columnWrapperStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <ProductCard
                    layoutMode="vertical"
                    item={item}
                    wishlist={wishlist}
                    cart={cart}
                    toggleWishlist={toggleWishlist}
                    updateQuantity={updateQuantity}
                    addToCart={addToCart}
                  />
                )}
              />
            </>
          )}
        </View>

      </ScrollView>
    </View>
  )
}