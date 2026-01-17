import { ArrowRightIcon } from "@/assets/svgs/ArrowRightIcon"
import FloatingCartBar from "@/components/FloatingCartBar"
import OfferProductCard from "@/components/OfferProductCard"
import useCartStore from "@/store/cartStore"
import useWishlistStore from "@/store/wishlistStore"
import { Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { View, Text, TouchableOpacity, FlatList,  StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Product {
  id: string
  name: string
  localName?: string
  weight: string
  price: number
  originalPrice: number
  category: string
}

export interface CartItem extends Product {
  quantity: number
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Surf Excel Easy Wash",
    localName: "Detergent Power",
    weight: "500 ml",
    price: 12,
    originalPrice: 14,
    category: "cleaning",
  },
  {
    id: "2",
    name: "Fortune Arhar Dal",
    localName: "Toor Dal",
    weight: "1 kg",
    price: 10,
    originalPrice: 12,
    category: "staples",
  },
  {
    id: "3",
    name: "Nescafe Clasico",
    localName: "Coffee",
    weight: "500 ml",
    price: 10,
    originalPrice: 12,
    category: "beverages",
  },
  {
    id: "4",
    name: "Everest Kashmirilal",
    localName: "Red Chilli Powder",
    weight: "1 kg",
    price: 5,
    originalPrice: 8,
    category: "spices",
  },
  { id: "5", name: "Coca Cola Tin", weight: "300 ml", price: 2, originalPrice: 3, category: "beverages" },
  {
    id: "6",
    name: "Nestle Masala",
    localName: "Maggi Noodles",
    weight: "280 g",
    price: 4,
    originalPrice: 5,
    category: "instant",
  },
  { id: "7", name: "Amul Butter", weight: "500 g", price: 8, originalPrice: 10, category: "dairy" },
  { id: "8", name: "Tata Salt", weight: "1 kg", price: 2, originalPrice: 3, category: "staples" },
  {
    id: "9",
    name: "Aashirvaad Atta",
    localName: "Whole Wheat",
    weight: "5 kg",
    price: 15,
    originalPrice: 18,
    category: "staples",
  },
  {
    id: "10",
    name: "Sunflower Oil",
    localName: "Cooking Oil",
    weight: "1 L",
    price: 8,
    originalPrice: 10,
    category: "oils",
  },
]


export default function OfferScreen() {
  const {offerId}=useLocalSearchParams()
  const offerName="Best Deals"

  const {cart,addToCart,updateQuantity,totalItems,totalPrice,cartItems}=useCartStore()
  const {wishlist,toggleWishlist}=useWishlistStore()
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen options={{headerTitle:`${offerName}#${offerId}`}}/>
      {/* Header */}


      {/* Products Grid */}
      <FlatList
        data={PRODUCTS}
        renderItem={({item})=><OfferProductCard item={item} layoutMode="vertical" wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart}/>}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 8, paddingBottom: totalItems > 0 ? 100 : 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Cart Bar */}
      <FloatingCartBar totalItems={totalItems} totalPrice={totalPrice}/>
    </SafeAreaView>
  )
}
