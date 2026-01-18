import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock product detail data
const mockProductDetail = {
  id: 'PROD001',
  name: 'Fresh Organic Tomatoes',
  category: 'Vegetables',
  sku: 'SKU-VEND01-VEG-TOM-1KG',
  image: '🍅',
  isActive: true,
  pricing: {
    sellingPrice: 45,
    mrp: 60,
    discountPercentage: 25,
  },
  stock: {
    current: 120,
    status: 'in-stock',
  },
  description:
    'Fresh, ripe organic tomatoes sourced directly from local farms. Perfect for daily cooking and salads. Available year-round.',
  attributes: {
    weight: '1 kg',
    unit: 'Per Kg',
    brand: 'Farm Fresh',
    expiry: '5 days',
  },
  insights: {
    ordersToday: 12,
    ordersThisWeek: 87,
    revenueGenerated: 3915,
  },
};

export default function ProductDetailScreen() {
  const {productId}=useLocalSearchParams()
  const [isActive, setIsActive] = useState(mockProductDetail.isActive);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleGoBack = () => {
    console.log('[v0] Navigating back to products list');
    router.back()
  };

  const handleEditProduct = async () => {
    setActionInProgress('edit');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('[v0] Opening edit product screen');
      Alert.alert('Edit Product', `Opening editor for ${mockProductDetail.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to open editor');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdatePrice = async () => {
    setActionInProgress('price');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('[v0] Opening price update screen');
      Alert.alert('Update Price', 'Opening price editor');
    } catch (error) {
      Alert.alert('Error', 'Failed to open price editor');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdateStock = async () => {
    setActionInProgress('stock');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log('[v0] Opening stock update screen');
      Alert.alert('Update Stock', 'Opening stock editor');
    } catch (error) {
      Alert.alert('Error', 'Failed to open stock editor');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleProduct = async () => {
    setActionInProgress('toggle');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const action = isActive ? 'disabled' : 'enabled';
      Alert.alert(
        'Confirm',
        `${isActive ? 'Disable' : 'Enable'} this product?`,
        [
          { text: 'Cancel', onPress: () => { } },
          {
            text: 'Confirm',
            onPress: () => {
              setIsActive(!isActive);
              Alert.alert('Success', `Product ${action} successfully!`);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle product');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteProduct = async () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${mockProductDetail.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: async () => {
            setActionInProgress('delete');
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              Alert.alert('Deleted', `${mockProductDetail.name} has been deleted.`);
              handleGoBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setActionInProgress(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const profitMargin = mockProductDetail.pricing.sellingPrice;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity className="p-2 -ml-2" onPress={handleGoBack}>
          <Feather name="chevron-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View className="flex-1 ml-2">
          <Text className="text-xl font-bold text-gray-900">Product Details</Text>
          <Text className="text-sm text-gray-600 mt-1">#{mockProductDetail.sku} or id:#{productId}</Text>
        </View>
        <View
          className={`${isActive ? 'bg-emerald-100' : 'bg-gray-100'} rounded-full px-3 py-1`}
        >
          <Text className={`text-xs font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Product Overview */}
          <View className="bg-white mx-4 mt-4 rounded-2xl  shadow-sm border border-gray-100">
            <View className='flex-1 items-center'>
              <View className="h-64 flex-1 rounded-2xl items-center justify-center mb-4">
                <Text className="text-6xl">{mockProductDetail.image}</Text>
              </View>
            </View>
            <View className='p-5 flex-1'>

              <Text className="text-2xl font-bold text-gray-900 text-left">
                {mockProductDetail.name}
              </Text>
              <Text className="text-sm text-gray-600 mt-2">{mockProductDetail.category}</Text>
              {mockProductDetail.sku && (
                <Text className="text-xs text-gray-500 mt-1">SKU: {mockProductDetail.sku}</Text>
              )}
            </View>
          </View>

          {/* Pricing Section */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">PRICING</Text>
            <View className="space-y-3">
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-gray-600 text-sm">Selling Price</Text>
                <Text className="text-2xl font-bold text-emerald-600">
                  ₹{mockProductDetail.pricing.sellingPrice}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-gray-600 text-sm">MRP</Text>
                <Text className="text-gray-900 font-semibold line-through">
                  ₹{mockProductDetail.pricing.mrp}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600 text-sm">Discount</Text>
                <View className="bg-red-100 rounded-full px-3 py-1">
                  <Text className="text-red-700 font-bold text-sm">
                    {mockProductDetail.pricing.discountPercentage}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stock Information */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">STOCK INFORMATION</Text>
            <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-3">
              <View>
                <Text className="text-gray-600 text-xs mb-1">Current Stock</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {mockProductDetail.stock.current}
                </Text>
              </View>
              <View
                className={`${mockProductDetail.stock.status === 'in-stock' ? 'bg-emerald-100' : mockProductDetail.stock.status === 'low-stock' ? 'bg-orange-100' : 'bg-red-100'} rounded-full px-4 py-2`}
              >
                <Text
                  className={`text-xs font-semibold ${mockProductDetail.stock.status === 'in-stock' ? 'text-emerald-700' : mockProductDetail.stock.status === 'low-stock' ? 'text-orange-700' : 'text-red-700'}`}
                >
                  {mockProductDetail.stock.status === 'in-stock'
                    ? 'In Stock'
                    : mockProductDetail.stock.status === 'low-stock'
                      ? 'Low Stock'
                      : 'Out of Stock'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleUpdateStock}
              disabled={actionInProgress === 'stock'}
              className={`bg-blue-50 border border-blue-200 rounded-xl p-3 flex-row items-center justify-center gap-2 ${actionInProgress === 'stock' ? 'opacity-50' : ''}`}
            >
              {actionInProgress === 'stock' ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={16} color="#2563eb" />
                  <Text className="text-blue-700 font-semibold text-sm">Update Stock</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Product Status */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">PRODUCT STATUS</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm">
                  {isActive ? 'Product is Active' : 'Product is Inactive'}
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  {isActive
                    ? 'Customers can see and order this product'
                    : 'Customers cannot see this product'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleToggleProduct}
                disabled={actionInProgress === 'toggle'}
                className={`ml-4 ${actionInProgress === 'toggle' ? 'opacity-50' : ''}`}
              >
                {actionInProgress === 'toggle' ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Feather
                    name="toggle-left"
                    size={28}
                    color={isActive ? '#059669' : '#d1d5db'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Description */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">DESCRIPTION</Text>
            <Text className="text-gray-900 text-sm leading-6 mb-4">
              {mockProductDetail.description}
            </Text>

            <Text className="text-sm font-semibold text-gray-600 mb-3">ATTRIBUTES</Text>
            <View className="space-y-2">
              {Object.entries(mockProductDetail.attributes).map(([key, value]) => (
                <View
                  key={key}
                  className="flex-row justify-between items-center pb-2 border-b border-gray-100"
                >
                  <Text className="text-gray-600 text-sm capitalize">{key}</Text>
                  <Text className="text-gray-900 font-semibold text-sm">{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Product Insights */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-3">PRODUCT INSIGHTS</Text>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-gray-600 text-xs mb-1">Orders Today</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {mockProductDetail.insights.ordersToday}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-xs mb-1">This Week</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {mockProductDetail.insights.ordersThisWeek}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-xs mb-1">Revenue Generated</Text>
                <Text className="text-xl font-bold text-emerald-600">
                  ₹{mockProductDetail.insights.revenueGenerated}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Sticky Action Buttons */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 safe-area-bottom">
        <View className="flex-row gap-3 mb-3">
          <TouchableOpacity
            onPress={handleEditProduct}
            disabled={actionInProgress === 'edit'}
            activeOpacity={0.7}
            className={`flex-1 bg-emerald-500 rounded-xl py-3.5 items-center justify-center ${actionInProgress === 'edit' ? 'opacity-50' : ''}`}
          >
            {actionInProgress === 'edit' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text className="text-white font-bold text-sm">Edit Product</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUpdatePrice}
            disabled={actionInProgress === 'price'}
            activeOpacity={0.7}
            className={`flex-1 bg-blue-500 rounded-xl py-3.5 items-center justify-center ${actionInProgress === 'price' ? 'opacity-50' : ''}`}
          >
            {actionInProgress === 'price' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-bold text-sm">Update Price</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleDeleteProduct}
          disabled={actionInProgress === 'delete'}
          activeOpacity={0.7}
          className={`w-full bg-red-100 border border-red-200 rounded-xl py-3.5 items-center justify-center ${actionInProgress === 'delete' ? 'opacity-50' : ''}`}
        >
          {actionInProgress === 'delete' ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <View className="flex-row items-center gap-2 justify-center">
              <Feather name="trash-2" size={16} color="#dc2626" />
              <Text className="text-red-700 font-bold text-sm">Disable Product</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
