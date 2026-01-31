import { SubCategory } from "@/types/categories-products.types"
import { Text, View } from "react-native"
import { TouchableOpacity } from "react-native"

interface SubcategoryItemProps{
  subcategory: SubCategory
  isActive: boolean
  onPress: () => void
}


export default function SubcategoryItem({
  subcategory,
  isActive,
  onPress,
}: SubcategoryItemProps) {
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`py-3 px-2 items-center ${isActive ? "border-l-4 border-green-500 bg-green-50" : "border-l-4 border-transparent"}`}
    >
      {/* Subcategory thumbnail skeleton */}
      <View className={`w-14 h-14 rounded-xl items-center justify-center ${isActive ? "bg-green-100" : "bg-gray-100"}`}>
        <View className="w-8 h-8 bg-gray-300 rounded-md" />
      </View>
      <Text
        className={`text-xs mt-2 text-center leading-4 ${isActive ? "text-green-600 font-semibold" : "text-gray-600"}`}
        numberOfLines={2}
      >
        {subcategory.name}
      </Text>
    </TouchableOpacity>
  )
}