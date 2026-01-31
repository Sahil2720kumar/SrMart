import { ArrowRightIcon } from "@/assets/svgs/ArrowRightIcon"
import { CloseIcon } from "@/assets/svgs/CloseIcon"
import { HeartIcon } from "@/assets/svgs/HeartIcon"
import { SearchIcon } from "@/assets/svgs/SearchIcon"
import FloatingCartBar from "@/components/FloatingCartBar"
import ProductCard from "@/components/ProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { useState, useMemo, useCallback } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from "react-native"
import { useInfiniteProducts, useCategories } from "@/hooks/queries"
import { Product } from "@/types/categories-products.types"

export default function AllProductsScreen({ navigation }: { navigation?: any }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  // Fetch categories
  const { data: categoriesData } = useCategories()

  // Build categories array with "All" option
  const categories = useMemo(() => {
    const cats = categoriesData?.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug
    })) || []
    return [{ id: 'all', name: 'All', slug: 'all' }, ...cats]
  }, [categoriesData])

  // Prepare filters for infinite query
  const filters = useMemo(() => ({
    categoryId: selectedCategory !== "All" ? selectedCategory : undefined,
    search: searchQuery || undefined,
  }), [selectedCategory, searchQuery])

  // Fetch products with infinite scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteProducts(filters)



  // Flatten paginated data
  const products = useMemo(() => {
    return data?.pages.flatMap(page => page) || []
  }, [data])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderFooter = () => {
    if (!isFetchingNextPage) return null
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#22c55e" />
      </View>
    )
  }

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="text-gray-500 mt-4">Loading products...</Text>
        </View>
      )
    }

    return (
      <View className="flex-1 items-center justify-center px-8 py-20">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Text style={{ fontSize: 32 }}>📦</Text>
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-2">No products found</Text>
        <Text className="text-gray-500 text-center">
          {searchQuery ? "Try adjusting your search term." : "Try adjusting your filter."}
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Search Input */}
      <View className="px-4 mb-4 mt-6">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4">
          <SearchIcon />
          <TextInput
            className="flex-1 py-3.5 px-3 text-black text-base"
            placeholder="Search products"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <CloseIcon />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 0 }}
        className="mb-4 max-h-14"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            className={`mr-2 px-4 py-2 h-10 rounded-full border ${
              selectedCategory === category.id 
                ? "bg-green-500 border-green-500" 
                : "bg-white border-gray-200"
            }`}
          >
            <Text className={`text-sm font-medium ${
              selectedCategory === category.id ? "text-white" : "text-gray-600"
            }`}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Count */}
      <View className="px-4 mb-2">
        <Text className="text-sm text-gray-500">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Products Grid */}
      {isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
            <Text style={{ fontSize: 32 }}>⚠️</Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">Error loading products</Text>
          <Text className="text-gray-500 text-center">Please try again later.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
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
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ 
            paddingHorizontal: 8, 
            paddingBottom: totalItems > 0 ? 100 : 20 
          }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Floating Cart Bar */}
      <FloatingCartBar totalItems={totalItems} totalPrice={totalPrice} />
    </View>
  )
}