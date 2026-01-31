import { useState, useMemo } from "react"
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from "react-native"
import { Stack, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"

// Components
import CategoryProductCard from "@/components/CategoryProductCard"
import SubcategoryItem from "@/components/SubcategoryItem"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"

// Queries
import { useCategoryDetail, useSubCategories, useProductsBySubCategory } from "@/hooks/queries/"



export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>()
  
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()
  
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null)

  // Fetch category details
  const { data: category, isLoading: isCategoryLoading, error: categoryError } = useCategoryDetail(categoryId as string)
  
  // Fetch subcategories for this category
  const { data: subcategories, isLoading: isSubCategoriesLoading, error: subCategoriesError } = useSubCategories(categoryId as string)
  
  // Fetch products for active subcategory
  const { data: products, isLoading: isProductsLoading, error: productsError } = useProductsBySubCategory(
    activeSubcategory || ""
  )

  // Set first subcategory as active when data loads
  useMemo(() => {
    if (subcategories && subcategories.length > 0 && !activeSubcategory) {
      setActiveSubcategory(subcategories[0].id)
    }
  }, [subcategories, activeSubcategory])

  // Loading state
  if (isCategoryLoading || isSubCategoriesLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    )
  }

  // Error state
  if (categoryError || subCategoriesError) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <StatusBar style="auto" />
        <Text className="text-red-500 text-center mb-4">Failed to load category</Text>
        <Text className="text-gray-600 text-center">
          {categoryError?.message || subCategoriesError?.message}
        </Text>
      </View>
    )
  }

  const categoryTitle = category?.name || "Category"

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="auto" />
      <Stack.Screen options={{ headerTitle: categoryTitle }} />

      {/* Main content */}
      <View className="flex-1 flex-row">
        {/* Left sidebar - Subcategories */}
        <ScrollView 
          className="w-[25%] bg-gray-50 border-r border-gray-100" 
          showsVerticalScrollIndicator={false}
        >
          {subcategories && subcategories.length > 0 ? (
            subcategories.map((subcategory) => (
              <SubcategoryItem
                key={subcategory.id}
                subcategory={subcategory}
                isActive={activeSubcategory === subcategory.id}
                onPress={() => setActiveSubcategory(subcategory.id)}
              />
            ))
          ) : (
            <View className="p-4">
              <Text className="text-gray-400 text-xs text-center">No subcategories</Text>
            </View>
          )}
        </ScrollView>

        {/* Right side - Products grid */}
        <View className="w-[75%] px-2 pt-3">
          {isProductsLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#22c55e" />
            </View>
          ) : productsError ? (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-red-500 text-center mb-2">Failed to load products</Text>
              <Text className="text-gray-600 text-sm text-center">{productsError.message}</Text>
            </View>
          ) : (
            <FlatList
              data={products || []}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <CategoryProductCard
                  layoutMode="vertical"
                  item={item}
                  wishlist={wishlist}
                  cart={cart}
                  toggleWishlist={toggleWishlist}
                  updateQuantity={updateQuantity}
                  addToCart={addToCart}
                />
              )}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-20">
                  <Text className="text-gray-400">No products found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </View>
  )
}