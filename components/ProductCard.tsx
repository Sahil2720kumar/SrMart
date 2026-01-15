import { TouchableOpacity, View, Text, Image } from "react-native";
import { HeartIcon } from "@/assets/svgs/HeartIcon";
import { Product } from "@/types/product.types";


interface ProductCardProps {
  item: Product;
  toggleWishlist: (id: string) => void;
  wishlist: string[];
}

const ProductCard = ({ item, toggleWishlist, wishlist }: ProductCardProps) => (
  <View className="w-[165px] bg-white rounded-2xl mr-3 border border-gray-100 overflow-hidden shadow-sm">
    {/* Wishlist button */}
    <TouchableOpacity
      className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm"
      onPress={() => toggleWishlist(item.id)}
    >
      <HeartIcon filled={wishlist.includes(item.id)} />
    </TouchableOpacity>

    {/* Product image */}
    <View className="h-[120px] items-center justify-center bg-gray-50 pt-4">
      <Image source={require(`@/assets/images/aashirvaad-atta-wheat-flour-bag.jpg`)} className="w-[80px] h-[100px]" resizeMode="contain" />
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
        <TouchableOpacity className="bg-green-500 px-4 py-2 rounded-lg">
          <Text className="text-white text-sm font-semibold">Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)

export default ProductCard;