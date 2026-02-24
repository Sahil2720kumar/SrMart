import { HeartIcon } from "@/assets/svgs/HeartIcon"
import { Text, TouchableOpacity, View } from "react-native"
import Feather from '@expo/vector-icons/Feather';
import { blurhash, Product } from "@/types/categories-products.types";
import { router } from "expo-router";
import { Image } from "expo-image";
import { CartProduct } from "@/store/cartStore";

interface OfferProductCardProps {
  layoutMode?: "horizontal" | "vertical"
  item: Product
  cart: Map<string, CartProduct>
  wishlist: Set<string>
  toggleWishlist: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  addToCart: (product: Product) => void
}

const OfferProductCard = ({ layoutMode = "horizontal", item, cart, wishlist, toggleWishlist, updateQuantity, addToCart }: OfferProductCardProps) => {
  const cartItem = cart.get(item.id)
  const isInCart = !!cartItem
  const isHorizontal = layoutMode === "horizontal"

  return (
    <TouchableOpacity
      onPress={() => router.push(`/products/${item.id}`)}
      className={`${isHorizontal ? "w-[165px]" : "flex-1 max-w-[48%]"} m-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}
    >
      {/* Product Image */}
      <View className="w-full h-28 bg-gray-100">
        <Image
          source={item.image}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={1000}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Discount badge — corner stamped */}
        {/* {item.discount_percentage && item.discount_percentage > 0 && (
          <View
            style={{ position: 'absolute', top: 0, left: 0 }}
            className="bg-red-500 px-2 py-1 rounded-br-xl rounded-tl-2xl"
          >
            <Text className="text-white text-xs font-extrabold tracking-wide">
              {item.discount_percentage}% OFF
            </Text>
          </View>
        )} */}

        {/* Wishlist button */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 8, right: 8 }}
          className="w-7 h-7 bg-white rounded-full items-center justify-center shadow-sm"
          onPress={() => toggleWishlist(item.id)}
        >
          <HeartIcon filled={wishlist.has(item.id)} />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View className="p-3">
        <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-gray-400 text-xs mt-1">{item.unit}</Text>

        {/* Price and Add Button */}
        <View className="flex-row items-center justify-between mt-3">
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-gray-900 font-bold text-base">
                ₹{item.discount_price ?? item.price}
              </Text>
              {item.discount_price && item.discount_price < item.price && (
                <Text className="text-gray-400 text-xs line-through">₹{item.price}</Text>
              )}
            </View>
            {item.discount_price && item.discount_price < item.price && (
              <Text className="text-green-600 text-xs font-semibold">
                You save ₹{(item.price - item.discount_price).toFixed(0)}
              </Text>
            )}
          </View>

          {isInCart ? (
            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                className="w-7 h-7 bg-green-500 rounded-full items-center justify-center"
                onPress={() => updateQuantity(item.id, -1)}
              >
                <Feather name="minus" size={14} color="white" />
              </TouchableOpacity>
              <Text className="text-gray-900 font-semibold text-base min-w-[20px] text-center">
                {cartItem.quantity}
              </Text>
              <TouchableOpacity
                className="w-7 h-7 bg-green-500 rounded-full items-center justify-center"
                onPress={() => updateQuantity(item.id, 1)}
              >
                <Feather name="plus" size={14} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="bg-green-500 px-4 py-1.5 rounded-full"
              onPress={() => addToCart(item)}
            >
              <Text className="text-white font-semibold text-sm">Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default OfferProductCard