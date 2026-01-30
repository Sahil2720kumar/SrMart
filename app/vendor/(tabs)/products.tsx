import VendorProductCard from '@/components/VendorProductCard';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useProductsByVendorId } from '@/hooks/queries';

type FilterType = 'all' | 'in_stock' | 'out_of_stock' | 'low_stock' | 'disabled';


export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const session = useAuthStore((state) => state.session);
  const vendorId = session?.user?.id;

  // Fetch products from Supabase
  const {
    data: products = [],
    isLoading,
    refetch,
    isRefetching,
  } = useProductsByVendorId()

  // Filter products based on search and filter type
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      activeFilter === 'all' || 
      product.stock_status === activeFilter ||
      (activeFilter === 'disabled' && !product.stock_status);
    
    return matchesSearch && matchesFilter;
  });

  // Count products by status
  const statusCounts = {
    all: products.length,
    'in_stock': products.filter((p) => p.stock_status === 'in_stock').length,
    'out_of_stock': products.filter((p) => p.stock_status === 'out_of_stock').length,
    'low_stock': products.filter((p) => p.stock_status === 'low_stock').length,
    disabled: products.filter((p) => !p.stock_status).length,
  };

  

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Products</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {filteredProducts.length} products
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/vendor/product/add")}
            activeOpacity={0.7}
            className="bg-emerald-500 rounded-xl px-4 py-2.5 flex-row items-center gap-2"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
          <Feather name="search" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-2">
            {(['all', 'in_stock', 'out_of_stock', 'low_stock', 'disabled'] as FilterType[]).map(
              (filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.7}
                  className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                    activeFilter === filter
                      ? 'bg-emerald-500'
                      : 'bg-gray-200 border border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${
                      activeFilter === filter ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {filter === 'in_stock'
                      ? 'In Stock'
                      : filter === 'out_of_stock'
                      ? 'Out of Stock'
                      : filter === 'low_stock'
                      ? 'Low Stock'
                      : filter === 'disabled'
                      ? 'Disabled'
                      : 'All'}
                  </Text>
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      activeFilter === filter ? 'bg-white/30' : 'bg-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        activeFilter === filter ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {statusCounts[filter]}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            )}
          </View>
        </ScrollView>
      </View>

      {/* Products List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <VendorProductCard item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center py-16">
          <Feather name="alert-circle" size={48} color="#9ca3af" />
          <Text className="text-gray-900 font-semibold text-center mt-4">
            No products found
          </Text>
          <Text className="text-gray-600 text-sm text-center mt-2 px-4">
            {searchQuery || activeFilter !== 'all'
              ? 'Try adjusting your search or filters to find products'
              : 'Start by adding your first product'}
          </Text>
          {!searchQuery && activeFilter === 'all' && (
            <TouchableOpacity
              onPress={() => router.push("/vendor/product/add")}
              className="bg-emerald-500 rounded-xl px-6 py-3 mt-4"
            >
              <Text className="text-white font-semibold">Add Product</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}