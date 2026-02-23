import { CloseIcon } from "@/assets/svgs/CloseIcon"
import { SearchIcon } from "@/assets/svgs/SearchIcon"
import OfferProductCard from "@/components/OfferProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { router } from "expo-router"
import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native"
import {
  useFetchRecentSearches,
  useFetchTrendingProducts,
  useFetchTrendingSearches,
  useAddRecentSearch,
} from "@/hooks/queries/useSearchQueries"

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("")

  const { cart, addToCart, updateQuantity } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: recentSearches = [], isLoading: recentLoading } = useFetchRecentSearches()
  const { data: trendingSearches = [], isLoading: trendingSearchLoading } = useFetchTrendingSearches(8)
  const { data: trendingProducts = [], isLoading: trendingProductsLoading } = useFetchTrendingProducts(10)
  const { mutate: addRecentSearch } = useAddRecentSearch()

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const navigateToResults = (term: string) => {
    if (!term.trim()) return
    addRecentSearch({ query: term })
    router.push(`/(tabs)/customer/search/search-results?query=${encodeURIComponent(term)}`)
  }

  const handleSearch = () => navigateToResults(searchQuery)

  const handleRecentSearch = (term: string) => {
    setSearchQuery(term)
    navigateToResults(term)
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  // Show trending search terms as chips if no recent searches exist yet
  const searchChips =
    recentSearches.length > 0
      ? recentSearches.map((s) => s.search_query)
      : trendingSearches.map((s) => s.search_query)

  const chipsLabel = recentSearches.length > 0 ? "Recent Search" : "Trending Searches"

  return (
    <View className="flex-1 bg-white">
      {/* Search Input */}
      <View className="px-4 mb-6 mt-6">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4">
          <SearchIcon />
          <TextInput
            className="flex-1 py-3.5 px-3 text-black text-base"
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <CloseIcon />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Recent / Trending Search Chips */}
        <View className="px-4 mb-6">
          {recentLoading || trendingSearchLoading ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : searchChips.length > 0 ? (
            <>
              <Text className="text-lg font-semibold text-gray-900 mb-3">{chipsLabel}</Text>
              <View className="flex-row flex-wrap gap-2">
                {searchChips.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleRecentSearch(term)}
                    className="bg-white border border-gray-200 rounded-full px-4 py-2"
                  >
                    <Text className="text-gray-700 text-sm">{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
        </View>

        {/* Trending Now Products */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3 px-4">Trending Now</Text>

          {trendingProductsLoading ? (
            <ActivityIndicator size="small" color="#6b7280" style={{ marginLeft: 16 }} />
          ) : (
            <FlatList
              data={trendingProducts}
              renderItem={({ item }) => (
                <OfferProductCard
                  item={{
                    id: item.id,
                    name: item.name,
                    unit: item.unit,
                    price: item.discount_price ?? item.price,
                    discount_price: item.price,
                    image: item.image ?? "/placeholder.svg?height=120&width=120",
                  }}
                  layoutMode="horizontal"
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
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  )
}