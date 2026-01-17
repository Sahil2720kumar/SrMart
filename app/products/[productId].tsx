import ProductCard from "@/components/ProductCard"
import SkeletonImage from "@/components/SkeletonImage"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { Stack, useLocalSearchParams } from "expo-router"
import { useState, useRef } from "react"
import { View, Text, TouchableOpacity, ScrollView, Dimensions, FlatList } from "react-native"

const { width } = Dimensions.get("window")

type Review = {
  id: string
  name: string
  avatar: string
  date: string
  rating: number
  comment: string
  images?: string[]
}

type Product = {
  id: string
  name: string
  localName?: string
  weight: string
  price: number
  originalPrice: number
  rating: number
  reviews: number
  description: string
  images: string[]
}

const sampleReviews: Review[] = [
  {
    id: "1",
    name: "Johnson Smith",
    avatar: "",
    date: "April 10, 2023",
    rating: 5,
    comment: "Recently I have purchased this perfume and it's fragrance is very nice, I loved it",
    images: ["img1", "img2"],
  },
  {
    id: "2",
    name: "Sarah Johnson",
    avatar: "",
    date: "March 25, 2023",
    rating: 4,
    comment: "Good quality product. Delivery was on time. Will order again.",
  },
  {
    id: "3",
    name: "Mike Williams",
    avatar: "",
    date: "March 15, 2023",
    rating: 5,
    comment: "Excellent product! Best price in the market.",
  },
]

const similarProducts = [
  { id: "2", name: "Fortune Soyabean Refined Oil", weight: "5 L", price: 10, originalPrice: 12 },
  { id: "3", name: "Fortune Rice Bran Refined Oil", weight: "5 L", price: 15, originalPrice: 18 },
  { id: "4", name: "Saffola Gold Oil", weight: "1 L", price: 8, originalPrice: 10 },
]

export default function ProductDetailScreen() {
  const {productId}=useLocalSearchParams()
  console.log("productId: ",productId);
  
  const defaultProduct: Product = {
    id: "1",
    name: "Fortune Sun Lite Refined Sunflower Oil",
    weight: "1 L",
    price: 12,
    originalPrice: 14,
    rating: 4.0,
    reviews: 146,
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Orci, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Orci sem feugiat ut nullam nisl orci, volutpat, felis. Nunc elit, et mattis commodo condimentum tellus et.",
    images: ["img1", "img2", "img3", "img4", "img5"],
  }

  const product = defaultProduct
  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [similarWishlist, setSimilarWishlist] = useState<string[]>([])
  const [similarCart, setSimilarCart] = useState<{ [key: string]: number }>({})
  const flatListRef = useRef<FlatList>(null)

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

  const onScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 32))
    setCurrentImageIndex(slideIndex)
  }

  const renderStars = (rating: number, size = 16) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={{ fontSize: size, color: i <= rating ? "#facc15" : "#d1d5db" }}>
          ★
        </Text>,
      )
    }
    return <View className="flex-row">{stars}</View>
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{headerTitle:`Product Name${productId}`}}/>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}

        {/* Image Carousel */}
        <View className="mb-4">
          <FlatList
            ref={flatListRef}
            data={product.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={() => (
              <View
                style={{ width: width - 32, marginHorizontal: 16 }}
                className="h-96 bg-gray-50 rounded-2xl items-center justify-center"
              >
                <SkeletonImage size="xlarge" />
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          {/* Pagination Dots */}
          <View className="flex-row justify-center mt-4">
            {product.images.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${index === currentImageIndex ? "bg-gray-800" : "bg-gray-300"}`}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View className="px-4">
          <Text className="text-xl font-bold text-gray-900 mb-2">{product.name}</Text>

          {/* Rating */}
          <View className="flex-row items-center mb-3">
            {renderStars(Math.floor(product.rating))}
            <Text className="text-sm text-gray-500 ml-2">
              {product.rating} ({product.reviews} Reviews)
            </Text>
          </View>

          {/* Price */}
          <View className="flex-row items-center mb-4">
            <Text className="text-2xl font-bold text-gray-900">${cart.get(productId)?.price}</Text>
            <Text className="text-lg text-gray-400 line-through ml-2">${cart.get(productId)?.originalPrice}</Text>
            <View className="bg-green-500 rounded-md px-2 py-1 ml-3">
              <Text className="text-xs font-semibold text-white">{discount}% OFF</Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-200 mb-4" />

          {/* Description */}
          <Text className="text-gray-600 leading-6 mb-1" numberOfLines={showFullDescription ? undefined : 3}>
            {product.description}
          </Text>
          <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
            <Text className="text-green-500 font-medium">{showFullDescription ? "Show Less" : "Read More"}</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews & Ratings */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Reviews & Ratings</Text>
 
          {/* Overall Rating */}
          <View className="flex-row items-center mb-4">
            <Text className="text-4xl font-bold text-gray-900 mr-2">4.2</Text>
            <View>
              {renderStars(4, 20)}
              <Text className="text-sm text-gray-500">120 Reviews</Text>
            </View>
          </View>

          {/* Individual Reviews */}
          {sampleReviews.slice(0, sampleReviews.length).map((review) => (
            <View key={review.id} className="bg-gray-50 rounded-2xl p-4 mb-3">
              <View className="flex-row items-center mb-2">
                {/* Avatar Skeleton */}
                <View className="w-10 h-10 bg-gray-300 rounded-full mr-3" />
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{review.name}</Text>
                  <Text className="text-xs text-gray-400">{review.date}</Text>
                </View>
                {renderStars(review.rating, 14)}
              </View>
              <Text className="text-gray-600 leading-5 mb-3">{review.comment}</Text>
              {review.images && (
                <View className="flex-row">
                  {review.images.map((_, idx) => (
                    <View key={idx} className="w-16 h-16 bg-gray-200 rounded-xl mr-2" />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Similar Products */}
        <View className="mt-6">
          <Text className="text-lg font-bold text-gray-900 px-4 mb-4">Similar Products</Text>
            <FlatList
              data={similarProducts}
              renderItem={({ item }) => <ProductCard item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            />
        </View>
      </ScrollView>

      {/* Bottom Add to Cart Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4"
        style={{ paddingBottom: 24 }}
      >
        <View className="flex-row items-center">
          {/* Quantity Selector */}
          <View className="flex-row items-center mr-4">
            <TouchableOpacity
              onPress={() => updateQuantity(productId,-1)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <Text className="text-gray-700 font-bold text-xl">−</Text>
            </TouchableOpacity>
            <Text className="mx-4 text-lg font-semibold">{cart.get(productId)?.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(productId,1)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <Text className="text-gray-700 font-bold text-xl">+</Text>
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={() => navigation?.navigate("Cart")}
            className="flex-1 flex-row items-center justify-center bg-green-500 rounded-full py-4"
          >
            <Text className="text-white font-semibold text-base mr-4">Add to Cart</Text>
            <View className="h-5 w-px bg-white/40" />
            <Text className="text-white font-bold text-base ml-4">{cart.get(productId)?.quantity * cart.get(productId)?.price}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
