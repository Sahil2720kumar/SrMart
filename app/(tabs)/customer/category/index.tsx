import { SearchIcon } from "@/assets/svgs/SearchIcon"
import CategoryCard from "@/components/CategoryCard"
import { router } from "expo-router"
import { useState } from "react"
import { View, Text, TextInput, ScrollView, StatusBar } from "react-native"
import Svg, { Path } from "react-native-svg"





// All categories data
export const allCategories = [
  {
    id: "1",
    name: "Vegetables & Fruits",
    description: "Fresh produce daily",
    itemCount: 120,
    color: "#dcfce7",
  },
  {
    id: "2",
    name: "Dairy & Breakfast",
    description: "Milk, eggs & more",
    itemCount: 85,
    color: "#fef3c7",
  },
  {
    id: "3",
    name: "Cold Drinks & Juices",
    description: "Beverages & soft drinks",
    itemCount: 64,
    color: "#fee2e2",
  },
  {
    id: "4",
    name: "Instant & Frozen Food",
    description: "Quick meals & snacks",
    itemCount: 92,
    color: "#e0e7ff",
  },
  {
    id: "5",
    name: "Tea & Coffee",
    description: "Hot beverages",
    itemCount: 48,
    color: "#fce7f3",
  },
  {
    id: "6",
    name: "Atta, Rice & Dal",
    description: "Staples & grains",
    itemCount: 76,
    color: "#ffedd5",
  },
  {
    id: "7",
    name: "Masala, Oil & Dry Fruits",
    description: "Spices & cooking essentials",
    itemCount: 110,
    color: "#fef9c3",
  },
  {
    id: "8",
    name: "Chicken, Meat & Fish",
    description: "Fresh & frozen",
    itemCount: 45,
    color: "#ffe4e6",
  },
  {
    id: "9",
    name: "Bakery & Biscuits",
    description: "Bread, cookies & cakes",
    itemCount: 58,
    color: "#f5d0fe",
  },
  {
    id: "10",
    name: "Sweet Tooth",
    description: "Chocolates & desserts",
    itemCount: 72,
    color: "#ccfbf1",
  },
  {
    id: "11",
    name: "Baby Care",
    description: "Diapers, food & more",
    itemCount: 34,
    color: "#cffafe",
  },
  {
    id: "12",
    name: "Personal Care",
    description: "Hygiene & grooming",
    itemCount: 156,
    color: "#e9d5ff",
  },
  {
    id: "13",
    name: "Cleaning & Household",
    description: "Detergents & supplies",
    itemCount: 88,
    color: "#d1fae5",
  },
  {
    id: "14",
    name: "Pet Care",
    description: "Food & accessories",
    itemCount: 42,
    color: "#fed7aa",
  },
]

// Category Card component


export default function AllCategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter categories based on search
  const filteredCategories = allCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to category detail screen
    router.push(`/(tabs)/customer/category/${categoryId}`)
    console.log("Navigate to category:", categoryId)
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
