import FloatingCartBar from "@/components/FloatingCartBar"
import ProductCard from "@/components/ProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import Feather from "@expo/vector-icons/Feather"
import { useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native"
import {
  SortOption,
  useAddRecentSearch,
  useSearchProducts,
} from "@/hooks/queries/useSearchQueries"

export default function SearchResultsScreen() {
  const { query, sort: sortParam } = useLocalSearchParams<{ query: string; sort: SortOption }>()

  const [searchQuery, setSearchQuery] = useState(query ?? "")         // ← what user types (instant UI update)
  const [debouncedQuery, setDebouncedQuery] = useState(query ?? "")   // ← delayed value sent to DB
  const [activeSort, setActiveSort] = useState<SortOption>((sortParam as SortOption) ?? "relevance")

  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()
  const { mutate: addRecentSearch } = useAddRecentSearch()

  // ── Sync sort param from layout (SortByBottomSheet changes URL params) ────────
  useEffect(() => {
    if (sortParam) setActiveSort(sortParam as SortOption)
  }, [sortParam])

  // ── Debounce: wait 500ms after user stops typing, then update debouncedQuery ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)  // only fires 500ms after last keystroke
    }, 500)

    return () => clearTimeout(timer) // cancel timer if user types again before 500ms
  }, [searchQuery])

  // ── Search query (uses debouncedQuery — NOT searchQuery) ─────────────────────
  // This means DB is only called when user STOPS typing for 500ms
  const { data: products = [], isLoading, isFetching } = useSearchProducts(debouncedQuery, activeSort)

  // ── Save search once we have results ─────────────────────────────────────────
  useEffect(() => {
    if (debouncedQuery.trim() && !isLoading) {
      addRecentSearch({ query: debouncedQuery, resultCount: products.length })
    }
    // Only fire when loading finishes, not on every re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  // On keyboard "Search" button press — skip debounce, search immediately
  const handleSubmit = () => {
    if (searchQuery.trim()) {
      setDebouncedQuery(searchQuery) // immediately trigger search without waiting 500ms
      addRecentSearch({ query: searchQuery })
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Search Input */}
      <View className="px-4 mb-4 mt-6">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4">
          <Feather name="search" size={24} color="gray" />
          <TextInput
            className="flex-1 py-3.5 px-3 text-black text-base"
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}   // updates searchQuery instantly (fast UI)
            onSubmitEditing={handleSubmit}  // pressing search key skips debounce
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery("")
              setDebouncedQuery("") // also clear debounced so results clear immediately
            }}>
              <Feather name="x-circle" size={24} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Label */}
      {debouncedQuery.length > 0 && (
        <View className="px-4 mb-4 flex-row items-center gap-2">
          <Text className="text-base font-semibold text-gray-900">
            Showing Result for "{debouncedQuery}"
          </Text>
          {isFetching && <ActivityIndicator size="small" color="#6b7280" />}
        </View>
      )}

      {/* Loading state (initial load) */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6b7280" />
        </View>
      ) : products.length > 0 ? (
        /* Products Grid */
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              from="serachStack"
              layoutMode="vertical"
              item={{
                id: item.id,
                name: item.name,
                unit: item.unit,
                price: item.discount_price ?? item.price,
                discount_price: item.price,
                image: item.image ?? "/placeholder.svg?height=120&width=120",
                category: item.category_name ?? "",
              }}
              wishlist={wishlist}
              cart={cart}
              toggleWishlist={toggleWishlist}
              updateQuantity={updateQuantity}
              addToCart={addToCart}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Text style={{ fontSize: 32 }}>🔍</Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">No results found</Text>
          <Text className="text-gray-500 text-center">
            We couldn't find any products matching "{debouncedQuery}". Try a different search term.
          </Text>
        </View>
      )}

      {/* Floating Cart Bar */}
      <FloatingCartBar totalItems={totalItems} totalPrice={totalPrice} />
    </View>
  )
}