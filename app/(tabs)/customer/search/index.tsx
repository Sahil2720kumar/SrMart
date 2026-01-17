import { CloseIcon } from "@/assets/svgs/CloseIcon"
import { HeartIcon } from "@/assets/svgs/HeartIcon"
import { SearchIcon } from "@/assets/svgs/SearchIcon"
import OfferProductCard from "@/components/OfferProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import Feather from "@expo/vector-icons/Feather"
import { router } from "expo-router"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from "react-native"

type Product = {
  id: string
  name: string
  localName?: string
  weight: string
  price: number
  originalPrice: number
  image: string
}

const recentSearches = ["Good Knight", "Tata Salt", "Sunflower Oil", "Dettol Liquid", "Madhur Sugar", "Amul Ghee"]

const trendingProducts: Product[] = [
  {
    id: "1",
    name: "Surf Excel Easy Wash Detergent Power",
    weight: "500 ml",
    price: 12,
    originalPrice: 14,
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "2",
    name: "Fortune Arhar Dal",
    localName: "Toor Dal",
    weight: "1 kg",
    price: 10,
    originalPrice: 12,
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "3",
    name: "Nescafe Classic Coffee",
    weight: "200 g",
    price: 8,
    originalPrice: 10,
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "4",
    name: "Tata Salt",
    weight: "1 kg",
    price: 2,
    originalPrice: 3,
    image: "/placeholder.svg?height=120&width=120",
  },
]

export default function SearchScreen({ navigation }: { navigation?: any }) {
  const [searchQuery, setSearchQuery] = useState("")
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()


  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/customer/search/search-results?query=${searchQuery}`)
    }
  }

  const handleRecentSearch = (term: string) => {
    setSearchQuery(term)
    router.push(`/(tabs)/customer/search/search-results?query=${term}`)
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}

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
        {/* Recent Search */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Recent Search</Text>
          <View className="flex-row flex-wrap gap-2">
            {recentSearches.map((term, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleRecentSearch(term)}
                className="bg-white border border-gray-200 rounded-full px-4 py-2"
              >
                <Text className="text-gray-700 text-sm">{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Now */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3 px-4">Trending Now</Text>

          <FlatList
            data={trendingProducts}
            renderItem={({ item }) => <OfferProductCard item={item} layoutMode="horizontal" wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          />

        </View>
      </ScrollView>
    </View>
  )
}


