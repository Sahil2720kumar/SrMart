import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, StatusBar } from "react-native"

// Icons
import { LocationIcon } from "@/assets/svgs/LocationIcon"
import { ChevronDownIcon } from "@/assets/svgs/ChevronDownIcon"
import { BagIcon } from "@/assets/svgs/BagIcon"
import { SearchIcon } from "@/assets/svgs/SearchIcon"
import { HeartIcon } from "@/assets/svgs/HeartIcon"
import { router } from "expo-router"

// Components
import ProductCard from "@/components/ProductCard"
import SkeletonImage from "@/components/SkeletonImage"
import useWishlistStore from "@/store/wishlistStore"
import useCartStore from "@/store/cartStore"
import OfferProductCard from "@/components/OfferProductCard"
import { Address } from "@/types/address.types"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import { BlurView } from "expo-blur"


// Category data
const categories = [
  { id: "1", name: "Vegetables\n& Fruits", image: "/fresh-vegetables-fruits-grocery.jpg" },
  { id: "2", name: "Dairy &\nBreakfast", image: "/dairy-milk-eggs-breakfast.jpg" },
  { id: "3", name: "Cold Drinks\n& Juices", image: "/cold-drinks-cola-juice-bottles.jpg" },
  { id: "4", name: "Instant &\nFrozen Food", image: "/instant-noodles-frozen-food-packets.jpg" },
  { id: "5", name: "Tea &\nCoffee", image: "/tea-coffee-powder-jar.jpg" },
  { id: "6", name: "Atta, Rice\n& Dal", image: "/rice-dal-flour-atta-bags.jpg" },
  { id: "7", name: "Masala, Oil\n& Dry Fruits", image: "/cooking-oil-spices-dry-fruits.jpg" },
  { id: "8", name: "Chicken,\nMeat & Fish", image: "/chicken-meat-fish-fresh.jpg" },
]

// Products data
const bestDeals = [
  {
    id: "1",
    name: "Surf Excel Easy Wash Detergent Power",
    weight: "500 ml",
    price: 120,
    originalPrice: 140,
    image: "/surf-excel-detergent-blue-pack.jpg",
    wishlisted: false,
  },
  {
    id: "2",
    name: "Fortune Arhar Dal (Toor Dal)",
    weight: "1 kg",
    price: 100,
    originalPrice: 120,
    image: "/fortune-arhar-dal-yellow-packet.jpg",
    wishlisted: false,
  },
  {
    id: "3",
    name: "Tata Salt Iodized",
    weight: "1 kg",
    price: 80,
    originalPrice: 100,
    image: "/tata-salt-white-packet.jpg",
    wishlisted: false,
  },
  {
    id: "4",
    name: "Aashirvaad Atta Whole Wheat",
    weight: "5 kg",
    price: 250,
    originalPrice: 300,
    image: "/aashirvaad-atta-wheat-flour-bag.jpg",
    wishlisted: false,
  },
]

const addresses: Address[] = [
  { id: "1", label: "Home", address: "6391 Elgin St. Celina, Delaware 10299", isDefault: true },
  { id: "2", label: "Office", address: "123 Business Ave. New York, NY 10001", isDefault: false },
  { id: "3", label: "Apartment", address: "456 Oak Lane. Los Angeles, CA 90001", isDefault: false },
]

export default function HomeScreen() {

  const [searchQuery, setSearchQuery] = useState("")

  const { cart, addToCart, updateQuantity, totalItems, totalPrice, cartItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()

  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(addresses[0])




  const CategoryItem = ({ item }: { item: (typeof categories)[0] }) => (
    <TouchableOpacity onPress={() => router.push(`/customer/category/${item.id}`)} className="items-center w-[80px] mr-2 mb-4">
      <View className="w-[70px] h-[70px] bg-gray-50 rounded-2xl items-center justify-center mb-2 border border-gray-100">
        {/* <Image source={require(`@/assets/images/cookies-cola-snacks-food-festival.jpg`)}className="w-[50px] h-[50px]" resizeMode="contain" /> */}
        <SkeletonImage size="small" />
      </View>
      <Text className="text-xs text-gray-700 text-center leading-4">{item.name}</Text>
    </TouchableOpacity>
  )

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/customer/search/search-results?query=${searchQuery}`)
    }
  }


  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="px-4 pt-14 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <LocationIcon />
            <View className="ml-2">
              <TouchableOpacity onPress={()=>setShowAddressSheet(!showAddressSheet)} className="flex-row items-center">
                <Text className="text-md font-medium text-gray-900">{selectedAddress.label}</Text>
                <View className="ml-1">
                  <ChevronDownIcon />
                </View>
              </TouchableOpacity>
              <Text className="text-sm text-gray-500 mt-0.5">{selectedAddress.address}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.navigate("/(tabs)/customer/order/cart")} className="w-10 h-10 items-center justify-center">
            <BagIcon itemCount={totalItems} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View className="px-4 pb-4 mt-4">
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 py-1 mr-3 shadow-sm">
            <SearchIcon />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Search"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          {/* <TouchableOpacity className="w-12 h-12 bg-green-500 rounded-xl items-center justify-center">
            <FilterIcon />
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Shop By Category</Text>
            <TouchableOpacity onPress={() => router.navigate("/(tabs)/customer/category")}>
              <Text className="text-green-500 font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap">
            {categories.map((category) => (
              <CategoryItem key={category.id} item={category} />
            ))}
          </View>
        </View>

        {/* Promotional Banner */}
        <View className="px-4 mb-6">
          <View className="bg-green-50 rounded-2xl p-5 flex-row items-center overflow-hidden">
            <View className="flex-1 pr-4">
              <Text className="text-xl font-bold text-gray-900 mb-1">World Food Festival,</Text>
              <Text className="text-xl font-bold text-gray-900 mb-1">Bring the world to</Text>
              <Text className="text-xl font-bold text-gray-900 mb-4">your Kitchen!</Text>
              <TouchableOpacity className="bg-green-500 px-5 py-3 rounded-xl self-start">
                <Text className="text-white font-semibold">Shop Now</Text>
              </TouchableOpacity>
            </View>
            <View className="w-[120px] h-[100px]">
              {/* <Image source={require(`@/assets/images/cookies-cola-snacks-food-festival.jpg`)}className="w-full h-full" resizeMode="contain" /> */}
              <SkeletonImage size="large" />
            </View>
          </View>
        </View>

        {/* Best Deals */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-bold text-gray-900">Best Deal</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/customer/offers/1')}>
              <Text className="text-green-500 font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={bestDeals}
            renderItem={({ item }) => <ProductCard item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          />
        </View>

        {/* Treading Deals */}
        <View className="mb-6 mt-6  ">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-bold text-gray-900">Treading Deals</Text>
            <TouchableOpacity>
              <Text className="text-green-500 font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={bestDeals}
            renderItem={({ item }) => <ProductCard item={item} wishlist={wishlist} cart={cart} toggleWishlist={toggleWishlist} updateQuantity={updateQuantity} addToCart={addToCart} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
          />
        </View>

        {showAddressSheet && (
          <BlurView
            intensity={10}
            experimentalBlurMethod='dimezisBlurView'
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
          />
        )}

        {/* Address Selection Bottom Sheet */}
        <SelectAddressBottomSheet
          isVisible={showAddressSheet}
          addresses={addresses}
          selectedAddress={selectedAddress}
          onSelectAddress={(address) => {
            setSelectedAddress(address)
            setShowAddressSheet(false)
          }}
          onClose={() => setShowAddressSheet(false)}
          onAddNewAddress={() => {
            setShowAddressSheet(false)
          }}
        />

        {/* Add some bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>
    </View>
  )
}
