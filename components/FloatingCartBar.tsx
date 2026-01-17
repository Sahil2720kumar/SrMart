import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { ArrowRightIcon } from '@/assets/svgs/ArrowRightIcon'
import { router } from 'expo-router'

interface FloatingCartBarProps {
  totalItems: number
  totalPrice: number
}


const FloatingCartBar = ({ totalItems, totalPrice }: FloatingCartBarProps) => {
  return (
    <View className="absolute bottom-6 left-4 right-4">
      <TouchableOpacity onPress={() => {
        router.navigate("/(tabs)/customer/order/cart")
      }} className="bg-green-500 rounded-2xl flex-row items-center px-4 py-3 shadow-lg">
        {/* Product Thumbnail */}
        <View className="w-12 h-12 bg-white rounded-xl items-center justify-center mr-3">
          <View className="w-8 h-8 bg-gray-200 rounded-lg" />
        </View>

        {/* Item Count and Total */}
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {totalItems} {totalItems === 1 ? "Item" : "Items"}
          </Text>
          <Text className="text-white font-bold text-lg">${totalPrice}</Text>
        </View>

        {/* View Cart Button */}
        <View className="flex-row items-center">
          <Text className="text-white font-semibold text-base mr-2">View Cart</Text>
          <ArrowRightIcon />
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default FloatingCartBar