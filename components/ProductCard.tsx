import { TouchableOpacity, View, Text, Image } from "react-native";
import { HeartIcon } from "@/assets/svgs/HeartIcon";
import { Product } from "@/types/product.types";
import SkeletonImage from "./SkeletonImage";
import { CartItem } from "@/types/cart.types";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";

interface ProductCardProps {
  from:string
  layoutMode?: "horizontal" | "vertical"
  item: Product
  cart: Map<string, CartItem>
  wishlist: Set<string>
  toggleWishlist: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  addToCart: (product: Product) => void
}

const ProductCard = ({ from,item, layoutMode, cart, wishlist, toggleWishlist, updateQuantity, addToCart }: ProductCardProps) => {
  const cartItem = cart.get(item.id)
  const isInCart = !!cartItem
  const isHorizontal = layoutMode === "horizontal" ? true : false

  return (
    <TouchableOpacity
      onPress={() => {
        router.push(`/products/${item.id}`)
      }}
      className={`${isHorizontal ? "flex-1 max-w-[48%]" : "w-[173px]"} bg-white rounded-2xl mr-3 border border-gray-100 overflow-hidden shadow-sm`}
    >
      {/* Wishlist button */}
      <TouchableOpacity
        className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm"
        onPress={() => toggleWishlist(item.id)}
      >
        <HeartIcon filled={wishlist.has(item.id)} />
      </TouchableOpacity>

      {/* Product image */}
      <View className="min-h-[120px] flex-auto items-center justify-center bg-gray-50 pt-4">
        {/* <Image source={require(`@/assets/images/aashirvaad-atta-wheat-flour-bag.jpg`)} className="w-[80px] h-[100px]" resizeMode="contain" /> */}
        <SkeletonImage size="large" />
      </View>

      {/* Product info */}
      <View className="p-3  flex-1 justify-between">
        <Text className="text-sm font-medium text-gray-900 mb-1" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-500 mb-2">{item.weight}</Text>

        <View className="flex-row items-center justify-between ">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-gray-900">₹{item.price}</Text>
            <Text className="text-xs text-gray-400 line-through ml-2">₹{item.originalPrice}</Text>
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
      </View>
    </TouchableOpacity>
  )
}

export default ProductCard;