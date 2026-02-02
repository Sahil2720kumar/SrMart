import { CartProduct } from "@/store/cartStore";
import { blurhash, Product } from "@/types/categories-products.types";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";


interface CartItemProps {
  item: CartProduct
  cart: Map<string, CartProduct>
  wishlist: Set<string>
  toggleWishlist: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  addToCart: (product: Product) => void

}

const CartItemComp = ({ item, cart, wishlist, toggleWishlist, updateQuantity, addToCart }: CartItemProps) => {
  return (
    <View className="flex-row items-center bg-white p-4 border-b border-gray-100">
      {/* Product Image Skeleton */}
      <View className="w-16 h-16  rounded-lg mr-3" >
        <Image
          source={item.product?.image}
          placeholder={{ blurhash: blurhash }}
          contentFit="cover"
          transition={1000}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      {/* Product Info */}
      <View className="flex-1">
        <Text className="text-md font-semibold text-gray-900 mb-1">{item.product?.name}</Text>
        <Text className="text-sm text-gray-500 mb-2">{item.product?.unit}</Text>
        <View className="flex-row gap-2 items-center">
          <Text className="text-gray-900 font-bold text-base">₹{item.product?.discount_price}</Text>
          <Text className="text-gray-400 text-xs line-through">₹{item.product?.price}</Text>
        </View>
      </View>

      {/* Quantity Selector */}
      <View className="flex-row items-center bg-gray-50 rounded-full px-2 py-1">
        <TouchableOpacity onPress={() => updateQuantity(item.productId, -1)} className="w-6 h-6 items-center justify-center">
          <Text className="text-gray-600 font-bold">−</Text>
        </TouchableOpacity>
        <Text className="mx-2 text-sm font-medium">{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.productId, 1)} className="w-6 h-6 items-center justify-center">
          <Text className="text-gray-600 font-bold">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default CartItemComp