import { ArrowRightIcon } from "@/assets/svgs/ArrowRightIcon"
import { CloseIcon } from "@/assets/svgs/CloseIcon"
import { HeartIcon } from "@/assets/svgs/HeartIcon"
import { SearchIcon } from "@/assets/svgs/SearchIcon"
import FloatingCartBar from "@/components/FloatingCartBar"
import OfferProductCard from "@/components/OfferProductCard"
import ProductCard from "@/components/ProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView } from "react-native"

type Product = {
  id: string
  name: string
  localName?: string
  weight: string
  price: number
  originalPrice: number
  category: string
  rating: number
  reviews: number
}

const allProducts: Product[] = [
  {
    id: "1",
    name: "Fortune Sun Lite Refined Sunflower Oil",
    weight: "1 L",
    price: 12,
    originalPrice: 14,
    category: "oil",
    rating: 4.0,
    reviews: 146,
  },
  {
    id: "2",
    name: "Aashirvaad Shudh Aata",
    weight: "10 kg",
    price: 12,
    originalPrice: 14,
    category: "atta",
    rating: 4.5,
    reviews: 230,
  },
  {
    id: "3",
    name: "Fortune Arhar Dal",
    localName: "Toor Dal",
    weight: "1 kg",
    price: 10,
    originalPrice: 12,
    category: "dal",
    rating: 4.2,
    reviews: 180,
  },
  {
    id: "4",
    name: "Nescafe Clasico Coffee",
    weight: "500 ml",
    price: 10,
    originalPrice: 12,
    category: "coffee",
    rating: 4.3,
    reviews: 95,
  },
  {
    id: "5",
    name: "Everest Kashmirilal Red Chilli Powder",
    weight: "1 kg",
    price: 5,
    originalPrice: 8,
    category: "spices",
    rating: 4.1,
    reviews: 120,
  },
  {
    id: "6",
    name: "Surf Excel Easy Wash Detergent Power",
    weight: "500 ml",
    price: 12,
    originalPrice: 14,
    category: "cleaning",
    rating: 4.4,
    reviews: 200,
  },
  {
    id: "7",
    name: "Coca Cola Tin",
    weight: "330 ml",
    price: 2,
    originalPrice: 3,
    category: "drinks",
    rating: 4.6,
    reviews: 350,
  },
  {
    id: "8",
    name: "Nestle Maggi Masala",
    weight: "70 g",
    price: 1,
    originalPrice: 2,
    category: "instant",
    rating: 4.7,
    reviews: 500,
  },
  {
    id: "9",
    name: "Amul Butter",
    weight: "500 g",
    price: 6,
    originalPrice: 7,
    category: "dairy",
    rating: 4.8,
    reviews: 420,
  },
  {
    id: "10",
    name: "Tata Salt",
    weight: "1 kg",
    price: 2,
    originalPrice: 3,
    category: "salt",
    rating: 4.3,
    reviews: 180,
  },
  {
    id: "11",
    name: "Mother Dairy Milk",
    weight: "1 L",
    price: 3,
    originalPrice: 4,
    category: "dairy",
    rating: 4.5,
    reviews: 290,
  },
  {
    id: "12",
    name: "Britannia Good Day Cookies",
    weight: "250 g",
    price: 3,
    originalPrice: 4,
    category: "snacks",
    rating: 4.4,
    reviews: 175,
  },
]

const categories = ["All", "Oil", "Atta", "Dal", "Coffee", "Spices", "Cleaning", "Drinks", "Dairy", "Snacks"]

export default function AllProductsScreen({ navigation }: { navigation?: any }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.localName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "All" || product.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })



  return (
    <View className="flex-1 bg-white">
      {/* Header */}

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
        contentContainerStyle={{ paddingHorizontal: 16,flexGrow: 0 }}
        className="mb-4 max-h-14"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            className={`mr-2 px-4 py-2 h-10 rounded-full border ${selectedCategory === category ? "bg-green-500 border-green-500" : "bg-white border-gray-200"
              }`}
          >
            <Text className={`text-sm font-medium ${selectedCategory === category ? "text-white" : "text-gray-600"}`}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Count */}
      <View className="px-4 mb-2">
        <Text className="text-sm text-gray-500">{filteredProducts.length} products found</Text>
      </View>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <ProductCard layoutMode="vertical" item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: totalItems > 0 ? 100 : 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Text style={{ fontSize: 32 }}>📦</Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900 mb-2">No products found</Text>
          <Text className="text-gray-500 text-center">Try adjusting your search or filter.</Text>
        </View>
      )}

      {/* Floating Cart Bar */}
      <FloatingCartBar totalItems={totalItems} totalPrice={totalPrice} />
    </View>
  )
}


