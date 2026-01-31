import { Text, TouchableOpacity, View } from "react-native"
import SkeletonImage from "./SkeletonImage"
import Svg, { Path } from "react-native-svg"
import { Category } from "@/types/categories-products.types"


interface CategoryCardProps {
  category: (Category & { product_count: number })
  onPress: () => void
}

export default function CategoryCard({
  category,
  onPress,
}:CategoryCardProps) {  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Category image skeleton with colored background */}
      <View
        className="w-20 h-20 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: category.color }}
      >
        <SkeletonImage/>
      </View>

      {/* Category info */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">{category.name}</Text>
        <Text className="text-sm text-gray-500 mb-2">{category.description}</Text>
        <View className="flex-row items-center">
          <View className="bg-green-100 px-2 py-1 rounded-md">
            <Text className="text-xs font-medium text-green-700">{category.product_count} items</Text>
          </View>
        </View>
      </View>

      {/* Arrow icon */}
      <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <Path d="M9 18l6-6-6-6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </TouchableOpacity>
  )
}