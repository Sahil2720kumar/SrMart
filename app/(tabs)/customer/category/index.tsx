import { SearchIcon } from "@/assets/svgs/SearchIcon"
import CategoryCard from "@/components/CategoryCard"
import { useCategories } from "@/hooks/queries"
import { Feather } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { View, Text, TextInput, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"




export default function AllCategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: allCategories = [], isLoading,error, isError, refetch,isRefetching, } = useCategories()

  // Filter categories based on search
  const filteredCategories = allCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to category detail screen
    router.push(`/(tabs)/customer/category/${categoryId}`)
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4">Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-4">
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-gray-900 font-bold text-lg mt-4">Failed to Load Inventory</Text>
          <Text className="text-gray-600 text-center mt-2">
            There was an error loading categories.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-emerald-500 rounded-xl px-6 py-3 mt-6"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        {/* Search bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-1">
          <SearchIcon />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900"
            placeholder="Search categories..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories list */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Categories count */}
        <Text className="text-sm text-gray-500 mb-3">{filteredCategories.length} categories available</Text>

        {/* Category cards */}
        {filteredCategories.map((category) => (
          <CategoryCard key={category.id} category={category} onPress={() => handleCategoryPress(category.id)} />
        ))}

        {/* Empty state */}
        {filteredCategories.length === 0 && (
          <View className="items-center justify-center py-20">
            <Svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="#d1d5db"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
            <Text className="text-gray-400 mt-4 text-base">No categories found</Text>
            <Text className="text-gray-400 text-sm">Try a different search term</Text>
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View className="h-28" />
      </ScrollView>
    </View>
  )
}
