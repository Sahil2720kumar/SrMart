import { useProductDetailsByVendorIdAndProductId, useProductImagesByProductId } from '@/hooks/queries';
import { blurhash } from '@/types/categories-products.types';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 62;

// ---------------------------------------------------------------------------
// Reusable Confirm Modal
// ---------------------------------------------------------------------------
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmStyle?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmStyle = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const confirmBg =
    confirmStyle === 'danger'
      ? 'bg-red-500'
      : confirmStyle === 'warning'
      ? 'bg-orange-500'
      : 'bg-emerald-500';

  const accentBg =
    confirmStyle === 'danger'
      ? 'bg-red-500'
      : confirmStyle === 'warning'
      ? 'bg-orange-500'
      : 'bg-emerald-500';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <View className={`h-1 w-full ${accentBg}`} />
          <View className="p-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm leading-6">{message}</Text>
          </View>
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-gray-600 font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 py-4 items-center ${confirmBg} ${loading ? 'opacity-60' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Modal state
  const [toggleModalVisible, setToggleModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const {
    data: product,
    isLoading: isLoadingProduct,
    refetch: refetchProduct,
  } = useProductDetailsByVendorIdAndProductId(productId);

  const { data: productImages, isLoading: isLoadingImages } =
    useProductImagesByProductId(productId);

  const isLoading = isLoadingProduct || isLoadingImages;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleGoBack = () => router.back();

  const handleEditProduct = async () => {
    setActionInProgress('edit');
    try {
      router.push(`/vendor/product/edit/${productId}`)
      Toast.show({
        type: 'info',
        text1: 'Edit Product',
        text2: `Opening editor for ${product?.name}`,
        position: 'top',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open editor.',
        position: 'top',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdatePrice = async () => {
    setActionInProgress('price');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      Toast.show({
        type: 'info',
        text1: 'Update Price',
        text2: 'Opening price editor.',
        position: 'top',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open price editor.',
        position: 'top',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUpdateStock = async () => {
    setActionInProgress('stock');
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      Toast.show({
        type: 'info',
        text1: 'Update Stock',
        text2: 'Opening stock editor.',
        position: 'top',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open stock editor.',
        position: 'top',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle — show confirm modal first
  const handleToggleProduct = () => {
    setToggleModalVisible(true);
  };

  const handleConfirmToggle = async () => {
    setToggleModalVisible(false);
    setActionInProgress('toggle');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // TODO: Implement toggle with Supabase
      const action = product?.is_available ? 'disabled' : 'enabled';
      Toast.show({
        type: 'success',
        text1: `Product ${action}`,
        text2: `${product?.name} is now ${action}.`,
        position: 'top',
      });
      refetchProduct();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to toggle product status.',
        position: 'top',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete — show confirm modal first
  const handleDeleteProduct = () => {
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteModalVisible(false);
    setActionInProgress('delete');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // TODO: Implement delete with Supabase
      Toast.show({
        type: 'success',
        text1: 'Product Deleted',
        text2: `${product?.name} has been deleted.`,
        position: 'top',
      });
      handleGoBack();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete product.',
        position: 'top',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setCurrentImageIndex(Math.round(offsetX / IMAGE_WIDTH));
  };

  // ---------------------------------------------------------------------------
  // Image carousel
  // ---------------------------------------------------------------------------
  const renderImageCarousel = () => {
    const images =
      productImages && productImages.length > 0
        ? productImages.sort((a, b) => a.display_order - b.display_order)
        : product?.image
        ? [{ id: 'main', image_url: product.image, is_primary: true }]
        : [];

    if (images.length === 0) {
      return (
        <View className="h-64 rounded-2xl items-center justify-center bg-gray-100">
          <Feather name="image" size={48} color="#9ca3af" />
          <Text className="text-gray-500 mt-2">No image available</Text>
        </View>
      );
    }

    return (
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {images.map((image) => (
            <View
              key={image.id}
              style={{ width: IMAGE_WIDTH }}
              className="h-64 rounded-2xl overflow-hidden bg-gray-100 p-2"
            >
              <Image
                source={{ uri: image.image_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                placeholder={{ blurhash }}
                transition={1000}
              />
            </View>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View className="flex-row justify-center mt-3 gap-2">
            {images.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentImageIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const calculateDiscount = () => {
    if (!product?.price || !product?.discount_price) return 0;
    return Math.round(((product.price - product.discount_price) / product.price) * 100);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity className="p-2 -ml-2" onPress={handleGoBack}>
          <Feather name="chevron-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View className="flex-1 ml-2">
          <Text className="text-xl font-bold text-gray-900">Product Details</Text>
          <Text className="text-sm text-gray-600 mt-1">#{product?.sku || productId}</Text>
        </View>
        <View
          className={`${product?.is_available ? 'bg-emerald-100' : 'bg-gray-100'} rounded-full px-3 py-1`}
        >
          <Text
            className={`text-xs font-semibold ${
              product?.is_available ? 'text-emerald-700' : 'text-gray-700'
            }`}
          >
            {product?.is_available ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : !product ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Product not found</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Product Overview */}
          <View className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-gray-100">
            <View className="p-4">{renderImageCarousel()}</View>
            <View className="p-5">
              <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>
              <Text className="text-sm text-gray-600 mt-2">
                {product.categories?.name || 'Uncategorized'}
              </Text>
              {product.sku && (
                <Text className="text-xs text-gray-500 mt-1">SKU: {product.sku}</Text>
              )}
            </View>
          </View>

          {/* Pricing */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">PRICING</Text>
            <View className="space-y-3">
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-gray-600 text-sm">Selling Price</Text>
                <Text className="text-2xl font-bold text-emerald-600">
                  ₹{product.discount_price || product.price}
                </Text>
              </View>
              {product.discount_price && product.discount_price < product.price && (
                <>
                  <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                    <Text className="text-gray-600 text-sm">MRP</Text>
                    <Text className="text-gray-900 font-semibold line-through">
                      ₹{product.price}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600 text-sm">Discount</Text>
                    <View className="bg-red-100 rounded-full px-3 py-1">
                      <Text className="text-red-700 font-bold text-sm">
                        {calculateDiscount()}%
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Stock Information */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">STOCK INFORMATION</Text>
            <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-3">
              <View>
                <Text className="text-gray-600 text-xs mb-1">Current Stock</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {product.stock_quantity} ({product.unit})
                </Text>
              </View>
              <View
                className={`${
                  product.stock_status === 'in_stock'
                    ? 'bg-emerald-100'
                    : product.stock_status === 'low_stock'
                    ? 'bg-orange-100'
                    : 'bg-red-100'
                } rounded-full px-4 py-2`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    product.stock_status === 'in_stock'
                      ? 'text-emerald-700'
                      : product.stock_status === 'low_stock'
                      ? 'text-orange-700'
                      : 'text-red-700'
                  }`}
                >
                  {product.stock_status === 'in_stock'
                    ? 'In Stock'
                    : product.stock_status === 'low_stock'
                    ? 'Low Stock'
                    : 'Out of Stock'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleUpdateStock}
              disabled={actionInProgress === 'stock'}
              className={`bg-blue-50 border border-blue-200 rounded-xl p-3 flex-row items-center justify-center gap-2 ${
                actionInProgress === 'stock' ? 'opacity-50' : ''
              }`}
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
                  {product.is_available ? 'Product is Active' : 'Product is Inactive'}
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  {product.is_available
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
                    name={product.is_available ? 'toggle-right' : 'toggle-left'}
                    size={28}
                    color={product.is_available ? '#059669' : '#d1d5db'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Description & Attributes */}
          {(product.description || Object.keys(product.attributes || {}).length > 0) && (
            <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
              {product.description && (
                <>
                  <Text className="text-sm font-semibold text-gray-600 mb-3">DESCRIPTION</Text>
                  <Text className="text-gray-900 text-sm leading-6 mb-4">
                    {product.description}
                  </Text>
                </>
              )}

              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <>
                  <Text className="text-sm font-semibold text-gray-600 mb-3">ATTRIBUTES</Text>
                  <View className="space-y-2">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <View
                        key={key}
                        className="flex-row justify-between items-center pb-2 border-b border-gray-100"
                      >
                        <Text className="text-gray-600 text-sm capitalize">{key}</Text>
                        <Text className="text-gray-900 font-semibold text-sm">{String(value)}</Text>
                      </View>
                    ))}
                    {[
                      { label: 'Unit', value: product.unit },
                      { label: 'Expiry Date', value: product.expiry_date },
                      { label: 'Is Vegetarian', value: product.is_veg ? 'Vegetarian' : '—' },
                      { label: 'Is Organic', value: product.is_organic ? 'Organic' : '—' },
                      { label: 'Sub Category', value: product.sub_categories?.name },
                    ].map(({ label, value }) => (
                      <View
                        key={label}
                        className="flex-row justify-between items-center pb-2 border-b border-gray-100"
                      >
                        <Text className="text-gray-600 text-sm capitalize">{label}</Text>
                        <Text className="text-gray-900 font-semibold text-sm">{value}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Product Insights */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-3">PRODUCT INSIGHTS</Text>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-gray-600 text-xs mb-1">Rating</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    {product.rating.toFixed(1)}
                  </Text>
                  <Feather name="star" size={16} color="#fbbf24" />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-xs mb-1">Reviews</Text>
                <Text className="text-2xl font-bold text-gray-900">{product.review_count}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-xs mb-1">Stock Value</Text>
                <Text className="text-xl font-bold text-emerald-600">
                  ₹
                  {(
                    product.stock_quantity * (product.discount_price || product.price)
                  ).toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Sticky Action Buttons ── */}
      {!isLoading && product && (
        <View className="bg-white px-4 py-4 border-t border-gray-200">
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={handleEditProduct}
              disabled={actionInProgress === 'edit'}
              activeOpacity={0.7}
              className={`flex-1 bg-emerald-500 rounded-xl py-3.5 items-center justify-center ${
                actionInProgress === 'edit' ? 'opacity-50' : ''
              }`}
            >
              {actionInProgress === 'edit' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">Edit Product</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUpdatePrice}
              disabled={actionInProgress === 'price'}
              activeOpacity={0.7}
              className={`flex-1 bg-blue-500 rounded-xl py-3.5 items-center justify-center ${
                actionInProgress === 'price' ? 'opacity-50' : ''
              }`}
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
            className={`w-full bg-red-100 border border-red-200 rounded-xl py-3.5 items-center justify-center ${
              actionInProgress === 'delete' ? 'opacity-50' : ''
            }`}
          >
            {actionInProgress === 'delete' ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <View className="flex-row items-center gap-2 justify-center">
                <Feather name="trash-2" size={16} color="#dc2626" />
                <Text className="text-red-700 font-bold text-sm">Delete Product</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Toggle Confirm Modal ── */}
      <ConfirmModal
        visible={toggleModalVisible}
        title={product?.is_available ? 'Disable Product?' : 'Enable Product?'}
        message={
          product?.is_available
            ? 'Customers will no longer be able to see or order this product.'
            : 'This product will become visible to customers again.'
        }
        confirmLabel={product?.is_available ? 'Disable' : 'Enable'}
        confirmStyle={product?.is_available ? 'warning' : 'primary'}
        loading={actionInProgress === 'toggle'}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleModalVisible(false)}
      />

      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Product?"
        message={`Are you sure you want to delete "${product?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={actionInProgress === 'delete'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </SafeAreaView>
  );
}