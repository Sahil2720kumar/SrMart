
import { useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { HeartIcon } from "@/assets/svgs/HeartIcon"
import SkeletonImage from "@/components/SkeletonImage"

import Feather from "@expo/vector-icons/Feather"
import { router } from "expo-router"
import { blurhash, Product } from "@/types/categories-products.types"
import { CartItem } from "@/types/orders-carts.types"
import { Image } from "expo-image"


interface CategoryProductCardProps {
  layoutMode?: "horizontal" | "vertical"
  item: Product
  cart: Map<string, CartItem>
  wishlist: Set<string>
  toggleWishlist: (productId: string) => void
  updateQuantity: (productId: string, delta: number) => void
  addToCart: (product: Product) => void

}
export default function CategoryProductCard({ layoutMode, item, cart, wishlist, toggleWishlist, updateQuantity, addToCart }: CategoryProductCardProps) {
  const cartItem = cart.get(item.id)
  const isInCart = !!cartItem
  const isHorizontal = layoutMode === "horizontal" ? true : false

  return (
    <TouchableOpacity onPress={() => {
      router.push(`/products/${item.id}`)
      // router.push(`/(tabs)/customer/category/product/${item.id}`)
    }}
      className={`${isHorizontal ? "flex-1 max-w-[48%]" : "max-w-[48%]"} overflow-hidden bg-white  rounded-2xl  mb-3 mr-2 flex-1  shadow-sm border border-gray-100`}
    >
      {/* Wishlist button */}
      <TouchableOpacity className="absolute top-3 right-3 z-10" onPress={() => toggleWishlist(item.id)}>
        <HeartIcon filled={wishlist.has(item.id)} />
      </TouchableOpacity>

      {/* Product image skeleton */}
      <View className="items-center py-2 w-[100%] h-36 overflow-hidden">
        <Image
          source={item.image}
          placeholder={{ blurhash: blurhash }}
          contentFit="cover"
          transition={1000}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <View className="px-3 pb-3">
        {/* Product info */}
        <Text className="text-sm font-semibold text-gray-900 mt-2" numberOfLines={1}>
          {item.name}
        </Text>
        {/* <Text className="text-xs text-gray-500">({item.sku})</Text> */}
        <Text className="text-xs text-gray-400 mt-1">{item.unit}</Text>

        {/* Price and Add button */}
        <View className="flex-row  items-center justify-between mt-2">
          <View className="">
            <Text className="text-base font-bold text-gray-900">₹{item.discount_price}</Text>
            <Text className="text-xs text-gray-400 line-through">₹{item.price}</Text>
          </View>
          {isInCart ? (
            <View className="flex-row  items-center">
              <TouchableOpacity
                className="w-8 h-8 bg-green-500 rounded-full items-center justify-center"
                onPress={() => updateQuantity(item.id, -1)}
              >
                <Feather name="minus" size={18} color="white" />
              </TouchableOpacity>
              <Text className=" text-gray-900 font-semibold text-base min-w-[20px] text-center">
                {cartItem.quantity}
              </Text>
              <TouchableOpacity
                className="w-8 h-8 bg-green-500 rounded-full items-center justify-center"
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