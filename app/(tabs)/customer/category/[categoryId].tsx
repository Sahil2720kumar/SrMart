import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native"
import { Stack, useLocalSearchParams } from "expo-router"
import { StatusBar } from "expo-status-bar"

// Components
import CategoryProductCard from "@/components/CategoryProductCard"
import SubcategoryItem from "@/components/SubcategoryItem"


// Subcategory type
export interface Subcategory {
  id: string
  name: string
}

// Product type
interface Product {
  id: string
  name: string
  localName: string
  weight: string
  price: number
  originalPrice: number
  subcategoryId: string
}

// Subcategories data
const subcategories: Subcategory[] = [
  { id: "1", name: "Fresh Vegetables" },
  { id: "2", name: "Fresh Fruits" },
  { id: "3", name: "Seasonal" },
  { id: "4", name: "Exotics" },
  { id: "5", name: "Sprouts" },
  { id: "6", name: "Leafies & Herbs" },
  { id: "7", name: "Flowers & Leaves" },
  
]

// Products data
const products: Product[] = [
  {
    id: "1",
    name: "Hybrid Tomato",
    localName: "Tamatar",
    weight: "500 g",
    price: 8,
    originalPrice: 10,
    subcategoryId: "1",
  },
  {
    id: "2",
    name: "Lady Finger",
    localName: "Bhindi",
    weight: "250 g",
    price: 7,
    originalPrice: 10,
    subcategoryId: "1",
  },
  {
    id: "3",
    name: "Green Chilli",
    localName: "Hari Mirch",
    weight: "500 g",
    price: 5,
    originalPrice: 8,
    subcategoryId: "1",
  },
  {
    id: "4",
    name: "Cluster Beans",
    localName: "Gawar Phali",
    weight: "250 g",
    price: 12,
    originalPrice: 14,
    subcategoryId: "1",
  },
  {
    id: "5",
    name: "Cabbage",
    localName: "Patta Gobhi",
    weight: "500 g",
    price: 8,
    originalPrice: 10,
    subcategoryId: "1",
  },
  {
    id: "6",
    name: "Capsicum",
    localName: "Shimla Mirch",
    weight: "250 g",
    price: 7,
    originalPrice: 10,
    subcategoryId: "1",
  },
  {
    id: "7",
    name: "Baby Potato",
    localName: "Chota Aloo",
    weight: "500 g",
    price: 10,
    originalPrice: 14,
    subcategoryId: "1",
  },
  { id: "8", name: "Green Peas", localName: "Matar", weight: "250 g", price: 5, originalPrice: 10, subcategoryId: "1" },
  { id: "9", name: "Apple", localName: "Seb", weight: "500 g", price: 15, originalPrice: 20, subcategoryId: "2" },
  { id: "10", name: "Banana", localName: "Kela", weight: "6 pcs", price: 6, originalPrice: 8, subcategoryId: "2" },
  { id: "11", name: "Orange", localName: "Santra", weight: "500 g", price: 12, originalPrice: 15, subcategoryId: "2" },
  { id: "12", name: "Mango", localName: "Aam", weight: "500 g", price: 18, originalPrice: 22, subcategoryId: "3" },
]



export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams()
  console.log("categoryId from params", categoryId)
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>("1")
  const categoryTitle = "Vegetables & Fruits"

  // Filter products by active subcategory
  const filteredProducts = products.filter((product) => product.subcategoryId === activeSubcategory)

  return (
    <View className="flex-1 bg-white">
      <StatusBar style='auto' />
      <Stack.Screen options={{headerTitle:categoryTitle}}/>
      {/* Header */}
      {/* <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity className="p-2 -ml-2">
          <BackIcon />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">{categoryTitle}</Text>
        <TouchableOpacity className="p-2 -mr-2">
          <SearchIcon />
        </TouchableOpacity>
      </View> */}

      {/* Main content */}
      <View className="flex-1 flex-row">
        {/* Left sidebar - Subcategories */}
        <ScrollView className="w-[25%] bg-gray-50 border-r border-gray-100" showsVerticalScrollIndicator={false}>
          {subcategories.map((subcategory) => (
            <SubcategoryItem
              key={subcategory.id}
              subcategory={subcategory}
              isActive={activeSubcategory === subcategory.id}
              onPress={() => setActiveSubcategory(subcategory.id)}
            />
          ))}
        </ScrollView>

        {/* Right side - Products grid */}
        <View className="w-[75%] px-2 pt-3">
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => <CategoryProductCard product={item} />}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-gray-400">No products found</Text>
              </View>
            }
          />
        </View>
      </View>
    </View>
  )
}
