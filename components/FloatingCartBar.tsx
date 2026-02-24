import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { blurhash } from '@/types/categories-products.types'
import useCartStore from '@/store/cartStore'
import { ArrowRightIcon } from '@/assets/svgs/ArrowRightIcon'

interface FloatingCartBarProps {
  totalItems: number
  totalPrice: number
}

const FloatingCartBar = ({ totalItems, totalPrice }: FloatingCartBarProps) => {
  const { cartItems } = useCartStore()

  // Show the most recently added item's image
  const latestItem = cartItems[cartItems.length - 1]

  if (totalItems === 0) return null

  return (
    <View className="absolute bottom-4 left-4 right-4">
      <TouchableOpacity
        onPress={() => router.navigate("/(tabs)/customer/order/cart")}
        activeOpacity={0.95}
        className="bg-green-500 rounded-2xl flex-row items-center px-3 py-3 shadow-xl"
        style={{
          shadowColor: '#16a34a',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {/* Single product thumbnail */}
        <View className="w-12 h-12 bg-white rounded-xl overflow-hidden items-center justify-center mr-3">
          {latestItem?.product?.image ? (
            <Image
              source={latestItem.product?.image}
              placeholder={{ blurhash }}
              contentFit="contain"
              transition={400}
              style={{ width: '85%', height: '85%' }}
            />
          ) : (
            <View className="w-8 h-8 bg-gray-100 rounded-lg" />
          )}
        </View>

        {/* Item count + price */}
        <View className="flex-1">
          <Text className="text-white/80 text-xs font-medium">
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
          </Text>
          <Text className="text-white font-bold text-lg leading-tight">
            ₹{totalPrice.toFixed(2)}
          </Text>
        </View>

        {/* View Cart */}
        <View className="flex-row items-center gap-2">
          <Text className="text-white font-bold text-base">View Cart</Text>
          <ArrowRightIcon />
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default FloatingCartBar