import FloatingCartBar from "@/components/FloatingCartBar"
import OfferProductCard from "@/components/OfferProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import Feather from "@expo/vector-icons/Feather"
import { useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native"

type Product = {
  id: string
  name: string
  weight: string
  price: number
  originalPrice: number
  category: string
}

const allProducts: Product[] = [
  { id: "1", name: "Aashirvaad Shudh Aata", weight: "10 kg", price: 12, originalPrice: 14, category: "atta" },
  { id: "2", name: "Aashirwad Select Atta", weight: "10 kg", price: 12, originalPrice: 14, category: "atta" },
  { id: "3", name: "Fortune Fresh Atta", weight: "5 kg", price: 5, originalPrice: 8, category: "atta" },
  { id: "4", name: "Mother Chakki Atta", weight: "10 kg", price: 8, originalPrice: 10, category: "atta" },
  { id: "5", name: "Dhruvam Wheat Atta", weight: "5 kg", price: 7, originalPrice: 10, category: "atta" },
  { id: "6", name: "Fresh Ultimate Atta", weight: "5 kg", price: 7, originalPrice: 10, category: "atta" },
  { id: "7", name: "Pillsbury Chakki Atta", weight: "5 kg", price: 6, originalPrice: 8, category: "atta" },
  { id: "8", name: "Tata Sampann Atta", weight: "10 kg", price: 14, originalPrice: 16, category: "atta" },
  { id: "9", name: "Surf Excel Detergent", weight: "500 ml", price: 12, originalPrice: 14, category: "cleaning" },
  { id: "10", name: "Tata Salt", weight: "1 kg", price: 2, originalPrice: 3, category: "salt" },
  { id: "11", name: "Fortune Sunflower Oil", weight: "1 L", price: 8, originalPrice: 10, category: "oil" },
]

export default function SearchResultsScreen() {
  const { query,sort  } = useLocalSearchParams()
  console.log("query", query);
  console.log("sort",sort);
  

  const [searchQuery, setSearchQuery] = useState(query || "")
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()


  const filteredProducts = allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )



  return (
    <View className="flex-1 bg-white">
      {/* Header */}

      {/* Search Input */}
      <View className="px-4 mb-4 mt-6">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4">
          <Feather name="search" size={24} color="gray" />
          <TextInput
            className="flex-1 py-3.5 px-3 text-black text-base"
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x-circle" size={24} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Label */}
      {searchQuery.length > 0 && (
        <View className="px-4 mb-4">
          <Text className="text-base font-semibold text-gray-900">Showing Result for "{searchQuery}"</Text>
        </View>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <OfferProductCard item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Text style={{ fontSize: 32 }}>🔍</Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">No results found</Text>
          <Text className="text-gray-500 text-center">
            We couldn't find any products matching "{searchQuery}". Try a different search term.
          </Text>
        </View>
      )}

      {/* Floating Cart Bar */}
      <FloatingCartBar totalItems={totalItems} totalPrice={totalPrice} />
    </View>
  )
}


