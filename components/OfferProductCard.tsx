import { HeartIcon } from "@/assets/svgs/HeartIcon"
import { Text, TouchableOpacity, View } from "react-native"
import Feather from '@expo/vector-icons/Feather';
import { Product } from "@/types/product.types";
import { CartItem } from "@/types/cart.types";
import { router } from "expo-router";

interface OfferProductCardProps {
  layoutMode?: "horizontal" | "vertical"
  item: Product
  cart: Map<string, CartItem>
  wishlist: Set<string>
  toggleWishlist: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  addToCart: (product: Product) => void

}

// Skeleton placeholder component
const SkeletonImage = () => (
  <View className="w-full h-28 bg-gray-200 rounded-lg items-center justify-center">
    <View className="w-12 h-12 bg-gray-300 rounded-lg" />
    <View className="w-16 h-2 bg-gray-300 rounded mt-2" />
  </View>
)

const OfferProductCard = ({ layoutMode="horizontal", item, cart, wishlist, toggleWishlist, updateQuantity, addToCart }: OfferProductCardProps) => {
  const cartItem = cart.get(item.id)
  const isInCart = !!cartItem
  const isHorizontal = layoutMode === "horizontal" ? true : false

  return (
    <TouchableOpacity onPress={() => {
      router.push(`/products/${item.id}`)
    }
    } className={`${isHorizontal ? "w-[165px]" : "flex-1 max-w-[48%]"}  m-2 bg-white rounded-2xl p-3 shadow-sm border border-gray-100`}>
      {/* Wishlist Button */}
      <TouchableOpacity className="absolute top-3 right-3 z-10" onPress={() => toggleWishlist(item.id)}>
        <HeartIcon filled={wishlist.has(item.id)} />
      </TouchableOpacity>

      {/* Product Image Skeleton */}
      <SkeletonImage size="medium" />

      {/* Product Info */}
      <View className="mt-3">
        <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
          {item.name}
        </Text>
        {item.localName && <Text className="text-gray-500 text-xs">({item.localName})</Text>}
        <Text className="text-gray-400 text-xs mt-1">{item.weight}</Text>
      </View>

      {/* Price and Add Button */}
      <View className="flex-row items-center justify-between mt-3">
        <View>
          <Text className="text-gray-900 font-bold text-base">${item.price}</Text>
          <Text className="text-gray-400 text-xs line-through">${item.originalPrice}</Text>
        </View>

        {isInCart ? (
          <View className="flex-row items-center">
            <TouchableOpacity
              className="w-7 h-7 bg-green-500 rounded-full items-center justify-center"
              onPress={() => updateQuantity(item.id, -1)}
            >
              <Feather name="minus" size={18} color="white" />
            </TouchableOpacity>
            <Text className=" text-gray-900 font-semibold text-base min-w-[20px] text-center">
              {cartItem.quantity}
            </Text>
            <TouchableOpacity
              className="w-7 h-7 bg-green-500 rounded-full items-center justify-center"
              onPress={() => updateQuantity(item.id, 1)}
            >
              <Feather name="plus" size={18} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity className="bg-green-500 px-5 py-2 rounded-full" onPress={() => addToCart(item)}>
            <Text className="text-white font-semibold text-sm">Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}


export default OfferProductCard