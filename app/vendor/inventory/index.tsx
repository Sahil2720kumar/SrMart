import VendorInventoryCard from '@/components/VendorInventoryCard';
import { useVendorInventory, useUpdateProductStock } from '@/hooks/queries';
import { Product } from '@/types/categories-products.types';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type FilterType = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SortType = 'stock-desc' | 'stock-asc' | 'name-asc';

export default function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('stock-desc');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState('');

  const {
    data: inventoryItems,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useVendorInventory();

  const updateStockMutation = useUpdateProductStock();

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const filteredItems = useMemo(() => {
    if (!inventoryItems) return [];

    let items = inventoryItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || item.stock_status === activeFilter;
      return matchesSearch && matchesFilter;
    });

    switch (sortBy) {
      case 'stock-asc':
        items.sort((a, b) => a.stock_quantity - b.stock_quantity);
        break;
      case 'name-asc':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stock-desc':
      default:
        items.sort((a, b) => b.stock_quantity - a.stock_quantity);
    }

    return items;
  }, [inventoryItems, searchQuery, activeFilter, sortBy]);

  const insights = useMemo(() => {
    if (!inventoryItems) {
      return { totalProducts: 0, inStockCount: 0, outOfStockCount: 0, lowStockCount: 0 };
    }
    return {
      totalProducts: inventoryItems.length,
      inStockCount: inventoryItems.filter((p) => p.stock_status === 'in_stock').length,
      outOfStockCount: inventoryItems.filter((p) => p.stock_status === 'out_of_stock').length,
      lowStockCount: inventoryItems.filter((p) => p.stock_status === 'low_stock').length,
    };
  }, [inventoryItems]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const onRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (err) {
      console.error('[Inventory] Refresh error:', err);
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Failed to refresh inventory. Please try again.',
        position: 'top',
      });
    }
  }, [refetch]);

  const handleOpenUpdateModal = (item: Product) => {
    setSelectedItem(item);
    setNewStockValue(item.stock_quantity.toString());
    setUpdateModalVisible(true);
  };

  const handleSaveStockUpdate = async () => {
    if (!selectedItem) return;

    if (!newStockValue || isNaN(parseInt(newStockValue))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Please enter a valid stock quantity.',
        position: 'top',
      });
      return;
    }

    const newStock = parseInt(newStockValue);

    if (newStock < 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Quantity',
        text2: 'Stock quantity cannot be negative.',
        position: 'top',
      });
      return;
    }

    try {
      await updateStockMutation.mutateAsync({
        productId: selectedItem.id,
        stockQuantity: newStock,
      });

      handleCloseModal();

      Toast.show({
        type: 'success',
        text1: 'Stock Updated',
        text2: `${selectedItem.name} → ${newStock} ${selectedItem.unit}`,
        position: 'top',
      });
    } catch (err) {
      console.error('[Inventory] Update error:', err);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update stock. Please try again.',
        position: 'top',
      });
    }
  };

  const handleCloseModal = () => {
    setUpdateModalVisible(false);
    setSelectedItem(null);
    setNewStockValue('');
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4">Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-4">
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-gray-900 font-bold text-lg mt-4">Failed to Load Inventory</Text>
          <Text className="text-gray-600 text-center mt-2">
            There was an error loading your inventory.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-emerald-500 rounded-xl px-6 py-3 mt-6"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
      <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Feather name="chevron-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900">Inventory</Text>
            <Text className="text-sm text-gray-600">Stock Management</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/vendor/product/add')}
          className="items-center"
        >
          <Feather name="plus-circle" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* ── Insights ── */}
      <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">Total Products</Text>
            <Text className="text-2xl font-bold text-gray-900">{insights.totalProducts}</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">In Stock</Text>
            <Text className="text-2xl font-bold text-emerald-600">{insights.inStockCount}</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">Low Stock</Text>
            <Text className="text-2xl font-bold text-orange-600">{insights.lowStockCount}</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">Out of Stock</Text>
            <Text className="text-2xl font-bold text-red-600">{insights.outOfStockCount}</Text>
          </View>
        </View>
      </View>

      {/* ── Low Stock Banner ── */}
      {insights.lowStockCount > 0 && (
        <View className="bg-orange-50 mx-4 mt-4 rounded-2xl p-4 border border-orange-200 flex-row items-start gap-3">
          <Feather name="alert-circle" size={20} color="#ea580c" />
          <View className="flex-1">
            <Text className="text-orange-700 font-semibold text-sm">
              {insights.lowStockCount} product{insights.lowStockCount > 1 ? 's' : ''} running low
            </Text>
            <Text className="text-orange-600 text-xs mt-1">
              Reorder soon to avoid stockouts
            </Text>
          </View>
        </View>
      )}

      {/* ── Search & Filters ── */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
          <Feather name="search" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search by product name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as FilterType[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
                className={`px-3 py-2 rounded-full ${
                  activeFilter === filter ? 'bg-emerald-500' : 'bg-gray-100 border border-gray-200'
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
                    ? 'Out'
                    : filter === 'low_stock'
                    ? 'Low'
                    : 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Sort pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { label: 'Stock High→Low', value: 'stock-desc' },
              { label: 'Stock Low→High', value: 'stock-asc' },
              { label: 'A→Z', value: 'name-asc' },
            ].map((sort) => (
              <TouchableOpacity
                key={sort.value}
                onPress={() => setSortBy(sort.value as SortType)}
                activeOpacity={0.7}
                className={`px-3 py-2 rounded-full ${
                  sortBy === sort.value
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-100 border border-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    sortBy === sort.value ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ── Inventory List ── */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <VendorInventoryCard handleOpenUpdateModal={handleOpenUpdateModal} item={item} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        scrollEnabled
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Feather name="package" size={48} color="#d1d5db" />
            <Text className="text-gray-900 font-semibold text-center mt-4">
              No products found
            </Text>
            <Text className="text-gray-600 text-sm text-center mt-2 px-4">
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first product'}
            </Text>
            {!searchQuery && activeFilter === 'all' && (
              <TouchableOpacity
                onPress={() => router.push('/vendor/product/add')}
                className="bg-emerald-500 rounded-xl px-6 py-3 mt-6"
              >
                <Text className="text-white font-semibold">Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Blur backdrop */}
      {updateModalVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* ── Stock Update Modal ── */}
      <Modal
        visible={updateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Update Stock</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                {/* Product Info */}
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <View className="w-16 h-16 bg-emerald-100 rounded-xl items-center justify-center">
                    <Feather name="package" size={32} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">{selectedItem.name}</Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      Current: {selectedItem.stock_quantity} ({selectedItem.unit})
                    </Text>
                  </View>
                </View>

                {/* Stock Input */}
                <Text className="text-gray-600 text-sm font-medium mb-2">New Stock Quantity</Text>
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2">
                  <Text className="text-2xl text-gray-900 font-bold">📦</Text>
                  <TextInput
                    placeholder="0"
                    value={newStockValue}
                    onChangeText={setNewStockValue}
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-2xl text-gray-900 font-bold"
                    placeholderTextColor="#d1d5db"
                    autoFocus
                  />
                  <Text className="text-gray-500 text-sm font-medium">{selectedItem.unit}</Text>
                </View>

                {/* Difference hint */}
                <Text className="text-gray-500 text-xs mb-6">
                  Difference:{' '}
                  {newStockValue
                    ? `${
                        parseInt(newStockValue) - selectedItem.stock_quantity > 0 ? '+' : ''
                      }${parseInt(newStockValue) - selectedItem.stock_quantity}`
                    : '0'}{' '}
                  {selectedItem.unit}
                </Text>

                {/* Save */}
                <TouchableOpacity
                  onPress={handleSaveStockUpdate}
                  disabled={updateStockMutation.isPending}
                  className={`bg-emerald-500 rounded-xl py-4 items-center justify-center mb-3 ${
                    updateStockMutation.isPending ? 'opacity-50' : ''
                  }`}
                >
                  {updateStockMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Save Update</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleCloseModal} className="py-3 items-center">
                  <Text className="text-gray-600 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}