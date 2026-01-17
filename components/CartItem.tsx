import { CartItem } from "@/types/cart.types";
import { Product } from "@/types/product.types";
import { Text, TouchableOpacity, View } from "react-native";


interface CartItemProps {
  item: Product
  cart: Map<string, CartItem>
  wishlist: Set<string>
  toggleWishlist: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  addToCart: (product: Product) => void

}

const CartItemComp = ({ item, cart, wishlist, toggleWishlist, updateQuantity, addToCart }: CartItemProps) => {
  return (
    <View className="flex-row items-center bg-white p-4 border-b border-gray-100">
      {/* Product Image Skeleton */}
      <View className="w-16 h-16 bg-gray-100 rounded-lg mr-3" />
      {/* Product Info */}
      <View className="flex-1">
        <Text className="text-md font-semibold text-gray-900 mb-1">{item.name}</Text>
        <Text className="text-sm text-gray-500 mb-2">{item.weight}</Text>
        <Text className="text-sm font-bold text-gray-900">${item.price}</Text>
      </View>

      {/* Quantity Selector */}
      <View className="flex-row items-center bg-gray-50 rounded-full px-2 py-1">
        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} className="w-6 h-6 items-center justify-center">
          <Text className="text-gray-600 font-bold">−</Text>
        </TouchableOpacity>
        <Text className="mx-2 text-sm font-medium">{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} className="w-6 h-6 items-center justify-center">
          <Text className="text-gray-600 font-bold">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default CartItemComp