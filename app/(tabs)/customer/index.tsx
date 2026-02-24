import { useEffect, useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StatusBar, ActivityIndicator } from "react-native"

import { LocationIcon } from "@/assets/svgs/LocationIcon"
import { ChevronDownIcon } from "@/assets/svgs/ChevronDownIcon"
import { BagIcon } from "@/assets/svgs/BagIcon"
import { SearchIcon } from "@/assets/svgs/SearchIcon"
import { router } from "expo-router"
import SkeletonImage from "@/components/SkeletonImage"
import useWishlistStore from "@/store/wishlistStore"
import useCartStore from "@/store/cartStore"
import OfferProductCard from "@/components/OfferProductCard"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import { BlurView } from "expo-blur"
import { useCategories, useCustomerAddresses } from "@/hooks/queries"
import { FullPageError } from "@/components/ErrorComp"
import { Image } from "expo-image"
import { blurhash } from "@/types/categories-products.types"
import { useBestSellerProducts, useTrendingProducts } from "@/hooks/queries/useDeals"

export default function HomeScreen() {
  const { data: categories = [], isLoading: isLoadingCategories, isError: isErrorCategories } = useCategories()
  const { data: addresses = [], isLoading: isLoadingAddresses, isError: isErrorAddresses } = useCustomerAddresses()
  const { data: bestSellerProducts = [], isLoading: isLoadingBestSellers, isError: isErrorBestSellers } = useBestSellerProducts()
  const { data: trendingProducts = [], isLoading: isLoadingTrending, isError: isErrorTrending } = useTrendingProducts()

  const [searchQuery, setSearchQuery] = useState("")
  const { cart, addToCart, updateQuantity, totalItems } = useCartStore()
  const { wishlist, toggleWishlist } = useWishlistStore()
  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<any>(null)

  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddress = addresses.find(a => a.is_default) || addresses[0]
      setSelectedAddress(defaultAddress)
    }
  }, [addresses])

  const CategoryItem = ({ item }: { item: (typeof categories)[0] }) => (
    <TouchableOpacity onPress={() => router.push(`/customer/category/${item.id}`)} className="items-center w-[80px] mr-2 mb-4">
      <View className="w-[70px] h-[70px] bg-gray-50 rounded-2xl items-center justify-center mb-2 border border-gray-100">
        {item.image ? (
          <Image
            source={item.image}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={1000}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <SkeletonImage size="small" />
        )}
      </View>
      <Text className="text-xs text-gray-700 text-center leading-4">{item.name}</Text>
    </TouchableOpacity>
  )

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/customer/search/search-results?query=${searchQuery}`)
    }
  }

  const isLoading = isLoadingAddresses || isLoadingCategories || isLoadingBestSellers || isLoadingTrending
  const isError = isErrorAddresses || isErrorCategories || isErrorBestSellers || isErrorTrending

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </View>
    )
  }

  if (isError) {
    return <FullPageError code="500" />
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
              <TouchableOpacity onPress={() => setShowAddressSheet(!showAddressSheet)} className="flex-row items-center">
                <Text className="text-md font-medium text-gray-900">{selectedAddress?.label || ""}</Text>
                <View className="ml-1">
                  <ChevronDownIcon />
                </View>
              </TouchableOpacity>
              <Text className="text-sm text-gray-500 mt-0.5">{selectedAddress?.address_line1 || ""}</Text>
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
          <View className="flex-row flex-wrap items-center justify-start">
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
              <SkeletonImage size="large" />
            </View>
          </View>
        </View>

        {/* Best Deals — from v_best_seller_products */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-bold text-gray-900">Best Deal</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/customer/offers/1')}>
              <Text className="text-green-500 font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          {bestSellerProducts.length === 0 ? (
            <Text className="px-4 text-gray-400 text-sm">No best deals available right now.</Text>
          ) : (
            <FlatList
              data={bestSellerProducts}
              renderItem={({ item }) => (
                <OfferProductCard
                  item={item}
                  layoutMode="horizontal"
                  wishlist={wishlist}
                  cart={cart}
                  toggleWishlist={toggleWishlist}
                  updateQuantity={updateQuantity}
                  addToCart={addToCart}
                />
              )}
              keyExtractor={(item) => item.id ?? item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            />
          )}
        </View>

        {/* Trending Deals — from v_trending_products */}
        <View className="mb-6 mt-6">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-bold text-gray-900">Trending Deals</Text>
            <TouchableOpacity>
              <Text className="text-green-500 font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          {trendingProducts.length === 0 ? (
            <Text className="px-4 text-gray-400 text-sm">No trending products right now.</Text>
          ) : (
            <FlatList
              data={trendingProducts}
              renderItem={({ item }) => (
                <OfferProductCard
                  item={item}
                  layoutMode="horizontal"
                  wishlist={wishlist}
                  cart={cart}
                  toggleWishlist={toggleWishlist}
                  updateQuantity={updateQuantity}
                  addToCart={addToCart}
                />
              )}
              keyExtractor={(item) => item.id ?? item.name}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
            />
          )}
        </View>

        {showAddressSheet && (
          <BlurView
            intensity={10}
            experimentalBlurMethod='dimezisBlurView'
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
          />
        )}

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
            router.push("/customer/account/my-addresses")
          }}
        />

        <View className="h-24" />
      </ScrollView>
    </View>
  )
}