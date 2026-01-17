import { CloseIcon } from "@/assets/svgs/CloseIcon"
import { HeartIcon } from "@/assets/svgs/HeartIcon"
import { SearchIcon } from "@/assets/svgs/SearchIcon"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import Feather from "@expo/vector-icons/Feather"
import { router } from "expo-router"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native"

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {trendingProducts.map((product) => (
              <View
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 p-3 mr-3"
                style={{ width: 160 }}
              >
                <View className="flex-1">
                  {/* Wishlist */}
                  <TouchableOpacity onPress={() => toggleWishlist(product.id)} className="absolute top-3 right-3 z-10">
                    <HeartIcon filled={wishlist.has(product.id)} />
                  </TouchableOpacity>

                  {/* Product Image Skeleton */}
                  <View className="w-full h-24 bg-gray-100 rounded-xl mb-2 items-center justify-center">
                    <View className="w-16 h-16 bg-gray-200 rounded-lg" />
                  </View>

                  {/* Product Info */}
                  <Text className="text-sm font-medium text-gray-900 mb-0.5" numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.localName && <Text className="text-xs text-gray-500 mb-0.5">({product.localName})</Text>}
                  <Text className="text-xs text-gray-400 mb-2">{product.weight}</Text>
                </View>
                {/* Price and Add */}
                <View className="flex-row flex-auto items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-sm font-bold text-gray-900">${product.price}</Text>
                    <Text className="text-xs text-gray-400 line-through">${product.originalPrice}</Text>
                  </View>

                  {!!cart.get(product.id) ? (
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        className="w-7 h-7 bg-green-500 rounded-full items-center justify-center"
                        onPress={() => updateQuantity(product.id, -1)}
                      >
                        <Feather name="minus" size={18} color="white" />
                      </TouchableOpacity>
                      <Text className=" text-gray-900 font-semibold text-base min-w-[20px] text-center">
                        {cart.get(product.id)?.quantity}
                      </Text>
                      <TouchableOpacity
                        className="w-7 h-7 bg-green-500 rounded-full items-center justify-center"
                        onPress={() => updateQuantity(product.id, 1)}
                      >
                        <Feather name="plus" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity className="bg-green-500 px-5 py-2 rounded-full" onPress={() => addToCart(product)}>
                      <Text className="text-white font-semibold text-sm">Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  )
}


