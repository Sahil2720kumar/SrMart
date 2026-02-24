import { TouchableOpacity, View, Text } from "react-native";
import { HeartIcon } from "@/assets/svgs/HeartIcon";
import { blurhash, Product } from "@/types/categories-products.types";
import { CartItem } from "@/types/orders-carts.types";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Image } from "expo-image";
import { CartProduct } from "@/store/cartStore";

interface ProductCardProps {
  from?: string
  layoutMode?: "horizontal" | "vertical"
  item: Product
  cart: Map<string, CartProduct>
  wishlist: Set<string>
  toggleWishlist: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  addToCart: (product: Product) => void
}

const ProductCard = ({ from, item, layoutMode, cart, wishlist, toggleWishlist, updateQuantity, addToCart }: ProductCardProps) => {
  const cartItem = cart.get(item.id)
  const isInCart = !!cartItem
  const isHorizontal = layoutMode === "horizontal"

  return (
    <TouchableOpacity
      onPress={() => router.push(`/products/${item.id}`)}
      className={`${isHorizontal ? "flex-1 max-w-[48%]" : "w-[173px]"} bg-white rounded-2xl mr-3 border border-gray-100 overflow-hidden shadow-sm`}
    >
      {/* Product image — fixed height, no padding, overflow hidden from parent */}
      <View style={{ height: 130, width: '100%', backgroundColor: '#f9fafb' }}>
        <Image
          source={item.image}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={1000}
          style={{ width: '100%', height: '100%' }}
        />
        {/* Wishlist button overlaid */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 8, right: 8 }}
          className="w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm"
          onPress={() => toggleWishlist(item.id)}
        >
          <HeartIcon filled={wishlist.has(item.id)} />
        </TouchableOpacity>

        {/* Discount badge */}
        {/* {item.discount_percentage && item.discount_percentage > 0 && (
          <View
            style={{ position: 'absolute', top: 0, left: 0 }}
            className="bg-green-500 px-2 py-1 rounded-br-xl rounded-tl-2xl"
          >
            <Text className="text-white text-xs font-extrabold tracking-wide">
              {item.discount_percentage}% OFF
            </Text>
          </View>
        )} */}
      </View>

      {/* Product info */}
      <View className="p-3">
        <Text className="text-sm font-medium text-gray-900 mb-0.5" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-xs text-gray-400 mb-2">{item.unit}</Text>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-gray-900">
              ₹{item.discount_price ?? item.price}
            </Text>
            {item.discount_price && (
              <Text className="text-xs text-gray-400 line-through">₹{item.price}</Text>
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

export default ProductCard;