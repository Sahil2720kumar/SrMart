import { Product } from "@/types/product.types"
import { useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { HeartIcon } from "@/assets/svgs/HeartIcon"
import SkeletonImage from "@/components/SkeletonImage"


interface CategoryProductCardProps {
  product: Product
}

export default function CategoryProductCard({ product }: CategoryProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)

  return (
    <View className="bg-white rounded-2xl p-3 mb-3 mr-2 flex-1 max-w-[130px] shadow-sm border border-gray-100">
      {/* Wishlist button */}
      <TouchableOpacity className="absolute top-3 right-3 z-10" onPress={() => setIsWishlisted(!isWishlisted)}>
        <HeartIcon filled={isWishlisted} />
      </TouchableOpacity>

      {/* Product image skeleton */}
      <View className="items-center py-2">
        <SkeletonImage size="medium" />
      </View>

      {/* Product info */}
      <Text className="text-sm font-semibold text-gray-900 mt-2" numberOfLines={1}>
        {product.name}
      </Text>
      <Text className="text-xs text-gray-500">({product.localName})</Text>
      <Text className="text-xs text-gray-400 mt-1">{product.weight}</Text>

      {/* Price and Add button */}
      <View className="flex-row items-center justify-between mt-2">
        <View>
          <Text className="text-base font-bold text-gray-900">${product.price}</Text>
          <Text className="text-xs text-gray-400 line-through">${product.originalPrice}</Text>
        </View>
        <TouchableOpacity className="bg-green-500 px-4 py-2 rounded-lg">
          <Text className="text-white text-sm font-semibold">Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}