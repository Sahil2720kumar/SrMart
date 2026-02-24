import ProductCard from "@/components/ProductCard"
import SkeletonImage from "@/components/SkeletonImage"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useState, useRef, useMemo } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  FlatList, 
  ActivityIndicator 
} from "react-native"
import { Image } from 'expo-image'
import { 
  useProductDetail, 
  useProductReviews, 
  useSimilarProducts 
} from "@/hooks/queries"
import { Review } from "@/types/reviews-notifications.types"

const { width } = Dimensions.get("window")

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj['

export default function ProductDetailScreen() {
  const router = useRouter()
  const { productId } = useLocalSearchParams<{ productId: string }>()
  
  const { cart, addToCart, updateQuantity, totalItems, totalPrice } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  // Fetch product details
  const { data: product, isLoading, isError } = useProductDetail(productId as string)
  
  // Fetch reviews
  const { data: reviews } = useProductReviews(productId as string)
  
  // Fetch similar products
  const { data: similarProducts } = useSimilarProducts(
    productId as string,
    product?.category_id || '',
    10
  )

  // Calculate discount
  const discount = useMemo(() => {
    if (!product?.discount_price) return 0
    return Math.round(((product.price - product.discount_price) / product.price) * 100)
  }, [product])

  // Get display price
  const displayPrice = product?.discount_price || product?.price || 0
  const originalPrice = product?.discount_price ? product.price : undefined

  // Prepare images array
  const productImages = useMemo(() => {
    if (!product) return []
    const images = product.product_images || []
    if (images.length === 0 && product.image) {
      return [{ id: 'main', image_url: product.image, is_primary: true }]
    }
    return images.sort((a, b) => {
      if (a.is_primary) return -1
      if (b.is_primary) return 1
      return a.display_order - b.display_order
    })
  }, [product])

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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;
  
    const cartItem = cart.get(product.id);
  
    if (!cartItem) {
      addToCart({
          id: product.id,
          name: product.name,
          price: originalPrice!,
          discount_price: displayPrice,
          image: product.image,
      });
    }
  
    router.push('/customer/order/cart');
  };
  // Handle quantity changes
  const handleQuantityChange = (delta: number) => {
    if (product) {
      const cartItem = cart.get(product.id)
      if (!cartItem && delta > 0) {
        addToCart({
          id: product.id,
          name: product.name,
          price: displayPrice,
          discount_price: originalPrice,
          image: product.image,
        })
      } else {
        updateQuantity(product.id, delta)
      }
    }
  }

  const cartItem = product ? cart.get(product.id) : null
  const currentQuantity = cartItem?.quantity || 0

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-gray-500 mt-4">Loading product details...</Text>
      </View>
    )
  }

  if (isError || !product) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text style={{ fontSize: 32 }}>⚠️</Text>
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-2">Product not found</Text>
        <Text className="text-gray-500 text-center">
          The product you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-green-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen 
        options={{
          headerTitle: product.name,
          headerTitleStyle: { fontSize: 16 }
        }}
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Carousel */}
        <View className="mb-4">
          {productImages.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={productImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                renderItem={({ item }) => (
                  <View
                    style={{ width: width - 32, marginHorizontal: 16 }}
                    className="h-96 bg-gray-50 rounded-2xl overflow-hidden"
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      placeholder={{ blurhash }}
                      contentFit="cover"
                      transition={1000}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />
              {/* Pagination Dots */}
              {productImages.length > 1 && (
                <View className="flex-row justify-center mt-4">
                  {productImages.map((_, index) => (
                    <View
                      key={index}
                      className={`w-2 h-2 rounded-full mx-1 ${
                        index === currentImageIndex ? "bg-gray-800" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View
              style={{ width: width - 32, marginHorizontal: 16 }}
              className="h-96 bg-gray-50 rounded-2xl items-center justify-center"
            >
              <SkeletonImage size="xlarge" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="px-4">
          <Text className="text-xl font-bold text-gray-900 mb-2">{product.name}</Text>

          {/* Weight/Unit */}
          <Text className="text-sm text-gray-500 mb-3">{product.unit}</Text>

          {/* Rating */}
          <View className="flex-row items-center mb-3">
            {renderStars(Math.floor(product.rating))}
            <Text className="text-sm text-gray-500 ml-2">
              {product.rating.toFixed(1)} ({product.review_count} Reviews)
            </Text>
          </View>

          {/* Price */}
          <View className="flex-row items-center mb-4">
            <Text className="text-2xl font-bold text-gray-900">${displayPrice.toFixed(2)}</Text>
            {originalPrice && (
              <>
                <Text className="text-lg text-gray-400 line-through ml-2">
                  ${originalPrice.toFixed(2)}
                </Text>
                <View className="bg-green-500 rounded-md px-2 py-1 ml-3">
                  <Text className="text-xs font-semibold text-white">{discount}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Stock Status */}
          <View className="mb-4">
            {product.stock_status === 'in_stock' ? (
              <Text className="text-green-600 font-medium">In Stock ({product.stock_quantity} available)</Text>
            ) : product.stock_status === 'low_stock' ? (
              <Text className="text-orange-600 font-medium">
                Low Stock ({product.stock_quantity} left)
              </Text>
            ) : (
              <Text className="text-red-600 font-medium">Out of Stock</Text>
            )}
          </View>

          {/* Badges */}
          <View className="flex-row flex-wrap mb-4">
            {product.is_organic && (
              <View className="bg-green-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-xs font-medium text-green-700">🌿 Organic</Text>
              </View>
            )}
            {product.is_veg && (
              <View className="bg-green-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-xs font-medium text-green-700">🥬 Vegetarian</Text>
              </View>
            )}
            {product.is_trending && (
              <View className="bg-purple-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-xs font-medium text-purple-700">🔥 Trending</Text>
              </View>
            )}
            {product.is_best_seller && (
              <View className="bg-yellow-100 px-3 py-1 rounded-full mr-2 mb-2">
                <Text className="text-xs font-medium text-yellow-700">⭐ Best Seller</Text>
              </View>
            )}
          </View>
 
          {/* Divider */}
          <View className="h-px bg-gray-200 mb-4" />

          {/* Description */}
          {product.description && (
            <>
              <Text 
                className="text-gray-600 leading-6 mb-1" 
                numberOfLines={showFullDescription ? undefined : 3}
              >
                {product.description}
              </Text>
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text className="text-green-500 font-medium mb-4">
                  {showFullDescription ? "Show Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Additional Info */}
          {product.expiry_date && (
            <View className="mb-2">
              <Text className="text-sm text-gray-500">
                <Text className="font-semibold">Expiry Date:</Text> {product.expiry_date}
              </Text>
            </View>
          )}
          {product.barcode && (
            <View className="mb-4">
              <Text className="text-sm text-gray-500">
                <Text className="font-semibold">Barcode:</Text> {product.barcode}
              </Text>
            </View>
          )}
        </View>

        {/* Reviews & Ratings */}
        {reviews && reviews.length > 0 && (
          <View className="px-4 mt-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Reviews & Ratings</Text>

            {/* Overall Rating */}
            <View className="flex-row items-center mb-4">
              <Text className="text-4xl font-bold text-gray-900 mr-2">
                {product.rating.toFixed(1)}
              </Text>
              <View>
                {renderStars(Math.floor(product.rating), 20)}
                <Text className="text-sm text-gray-500">{product.review_count} Reviews</Text>
              </View>
            </View>

            {/* Individual Reviews */}
            {reviews.slice(0, 3).map((review: Review) => (
              <View key={review.id} className="bg-gray-50 rounded-2xl p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  {/* Avatar Skeleton */}
                  <View className="w-10 h-10 bg-gray-300 rounded-full mr-3" />
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">Customer</Text>
                    <Text className="text-xs text-gray-400">{formatDate(review.created_at)}</Text>
                  </View>
                  {renderStars(review.rating, 14)}
                </View>
                {review.comment && (
                  <Text className="text-gray-600 leading-5">{review.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-bold text-gray-900 px-4 mb-4">Similar Products</Text>
            <FlatList
              data={similarProducts}
              renderItem={({ item }) => (
                <ProductCard
                  item={item}
                  wishlist={wishlist}
                  cart={cart}
                  toggleWishlist={toggleWishlist}
                  updateQuantity={updateQuantity}
                  addToCart={addToCart}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom Add to Cart Bar */}
      {product.stock_status !== 'out_of_stock' && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4"
          style={{ paddingBottom: 24 }}
        >
          <View className="flex-row items-center">
            {/* Quantity Selector */}
            {currentQuantity > 0 ? (
              <View className="flex-row items-center mr-4">
                <TouchableOpacity
                  onPress={() => handleQuantityChange(-1)}
                  className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-gray-700 font-bold text-xl">−</Text>
                </TouchableOpacity>
                <Text className="mx-4 text-lg font-semibold">{currentQuantity}</Text>
                <TouchableOpacity
                  onPress={() => handleQuantityChange(1)}
                  className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                  disabled={currentQuantity >= product.stock_quantity}
                >
                  <Text className={`font-bold text-xl ${
                    currentQuantity >= product.stock_quantity ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Add to Cart Button */}
            <TouchableOpacity
              onPress={() => currentQuantity > 0 ? router.push('/customer/order/cart') : handleQuantityChange(1)}
              className="flex-1 flex-row items-center justify-center bg-green-500 rounded-full py-4"
            >
              <Text className="text-white font-semibold text-base mr-4">
                {currentQuantity > 0 ? 'Go to Cart' : 'Add to Cart'}
              </Text>
              {currentQuantity > 0 && (
                <>
                  <View className="h-5 w-px bg-white/40" />
                  <Text className="text-white font-bold text-base ml-4">
                    ${(currentQuantity * displayPrice).toFixed(2)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}