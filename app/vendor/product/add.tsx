import { useCategoriesWithSubCategories } from '@/hooks/queries';
import { useCreateProduct } from '@/hooks/queries';
import useDraftProductStore from '@/store/useDraftProductStore';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function AddProductScreen() {
  // Auth & Data Hooks
  const session = useAuthStore((state) => state.session);
  const { data: categoryData, isLoading: categoriesLoading } = useCategoriesWithSubCategories();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { draft, hasDraft, saveDraft, clearDraft } = useDraftProductStore();

  // Form State
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);
  const [brand, setBrand] = useState('');
  const [unitSize, setUnitSize] = useState('');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [isActive, setIsActive] = useState(true);
  const [isOrganic, setIsOrganic] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Array<{ uri: string; altText: string; isPrimary: boolean }>>([]);

  const [sku, setSku] = useState('');

  // UI State
  const [selectedCategory, setSelectedCategory] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(false);

  // Transform Supabase data for UI
  const categories = categoryData?.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
  }));

  const categoriesWithSubcategories = categoryData?.reduce((acc, cat) => {
    acc[cat.name] = cat.sub_categories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      commission_rate: sub.commission_rate,
    }));
    return acc;
  }, {} as Record<string, { id: string; name: string; slug: string; commission_rate: number }[]>);

  // Load draft on mount
  useEffect(() => {
    if (!hasDraft || !draft) return;

    setProductName(draft.productName || '');
    setCategory(draft.category || '');
    setSubCategory(draft.subCategory || '');
    setBrand(draft.brand || '');
    setUnitSize(draft.unitSize || '');
    setMrp(draft.mrp || '');
    setSellingPrice(draft.sellingPrice || '');
    setInitialStock(draft.initialStock || '');
    setLowStockThreshold(draft.lowStockThreshold || '10');
    setIsActive(draft.isActive ?? true);
    setDescription(draft.description || '');
    setShortDescription(draft.shortDescription || '');
    setExpiryDate(draft.expiryDate || '');
    setBarcode(draft.barcode || '');
    setSku(draft.sku || '');
    setUploadedImages(draft.uploadedImages || []);
  }, [hasDraft, draft]);

  // Auto-generate SKU when category/product name changes
  useEffect(() => {
    if (productName && category) {
      const categoryPrefix = category.substring(0, 3).toUpperCase();
      const productPrefix = productName.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setSku(`${categoryPrefix}-${productPrefix}-${randomNum}`);
    }
  }, [productName, category]);

  // Reset sub-category when category changes
  useEffect(() => {
    setSubCategory('');
    setSubCategoryId('');
    setCommissionRate(0);
  }, [category]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload product images.'
        );
      }
    })();
  }, []);

  const handleGoBack = () => {
    if (productName || uploadedImages.length > 0) {
      Alert.alert(
        'Unsaved Changes',
        'Do you want to save as draft before leaving?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
          {
            text: 'Save Draft',
            onPress: () => {
              handleSaveAsDraft();
              router.back();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please grant camera roll permissions to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          altText: `${productName || 'Product'} - Image ${uploadedImages.length + index + 1}`,
          isPrimary: uploadedImages.length === 0 && index === 0, // First image is primary
        }));
        
        setUploadedImages([...uploadedImages, ...newImages]);
        Alert.alert('Success', `${newImages.length} image(s) added successfully!`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newImages = uploadedImages.filter((_, i) => i !== index);
          
          // If removed image was primary, make first image primary
          if (uploadedImages[index].isPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true;
          }
          
          setUploadedImages(newImages);
        },
      },
    ]);
  };

  const handleSetPrimaryImage = (index: number) => {
    const newImages = uploadedImages.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setUploadedImages(newImages);
    Alert.alert('Success', 'Primary image updated');
  };

  const handleEditAltText = (index: number) => {
    Alert.prompt(
      'Edit Image Description',
      'Enter a description for this image (for accessibility)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (text) => {
            if (text) {
              const newImages = [...uploadedImages];
              newImages[index].altText = text;
              setUploadedImages(newImages);
            }
          },
        },
      ],
      'plain-text',
      uploadedImages[index].altText
    );
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!productName.trim()) errors.push('Product name is required');
    if (!category.trim()) errors.push('Category is required');
    if (!subCategory.trim()) errors.push('Sub category is required');
    if (!unitSize.trim()) errors.push('Unit/Size is required');
    if (!mrp.trim()) errors.push('MRP is required');
    if (!sellingPrice.trim()) errors.push('Selling price is required');
    if (!initialStock.trim()) errors.push('Initial stock is required');

    const mrpValue = Number(mrp);
    const sellingPriceValue = Number(sellingPrice);
    const stockValue = Number(initialStock);

    if (isNaN(mrpValue) || mrpValue <= 0) errors.push('MRP must be a valid number greater than 0');
    if (isNaN(sellingPriceValue) || sellingPriceValue <= 0)
      errors.push('Selling price must be a valid number greater than 0');
    if (sellingPriceValue > mrpValue) errors.push('Selling price cannot exceed MRP');
    if (isNaN(stockValue) || stockValue < 0) errors.push('Stock cannot be negative');

    if (uploadedImages.length === 0) {
      errors.push('At least one product image is required');
    }

    return errors;
  };

  const handleSaveAndPublish = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to add products');
      return;
    }

    // Calculate discount percentage
    const discountPercentage =
      mrp && sellingPrice
        ? parseFloat(((Number(mrp) - Number(sellingPrice)) / Number(mrp) * 100).toFixed(2))
        : 0;

    // Determine stock status
    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    const stock = Number(initialStock);
    const threshold = Number(lowStockThreshold) || 10;
    
    if (stock === 0) {
      stockStatus = 'out_of_stock';
    } else if (stock <= threshold) {
      stockStatus = 'low_stock';
    }

    createProduct(
      {
        // Product data
        product: {
          vendor_id: session.user.id,
          category_id: categoryId,
          sub_category_id: subCategoryId || undefined,
          sku: sku || `SKU-${Date.now()}`,
          slug: productName.toLowerCase().replace(/\s+/g, '-'),
          name: productName,
          description: description || undefined,
          short_description: shortDescription || undefined,
          price: Number(mrp),
          discount_price: Number(sellingPrice) < Number(mrp) ? Number(sellingPrice) : undefined,
          // discount_percentage: discountPercentage, ///auto generated
          unit: unitSize,
          stock_quantity: Number(initialStock),
          low_stock_threshold: Number(lowStockThreshold) || 10,
          // stock_status: stockStatus, //auto generated
          is_available: isActive,
          is_trending: false,
          is_best_seller: false,
          is_featured: false,
          is_organic: isOrganic,
          is_veg: isVeg,
          commission_type: "subcategory",
          commission_rate: commissionRate,
          attributes: {
            brand: brand || undefined,
          },
          rating: 0,
          review_count: 0,
          expiry_date: expiryDate || '',
          barcode: barcode || '',
        },
        // Product images
        productImages: uploadedImages,
      },
      {
        onSuccess: (data) => {
          clearDraft();
          Alert.alert('Success', `"${productName}" published successfully!`, [
            {
              text: 'View Product',
              onPress: () => router.push(`/vendor/product/${data.id}`),
            },
            {
              text: 'Add Another',
              onPress: () => resetForm(),
            },
          ]);
        },
        onError: (error: Error) => {
          console.error('Product creation error:', error);
          Alert.alert('Error', error.message || 'Failed to create product. Please try again.');
        },
      }
    );
  };

  const handleSaveAsDraft = async () => {
    try {
      saveDraft({
        productName,
        category,
        categoryId,
        subCategory,
        subCategoryId,
        commissionRate,
        brand,
        unitSize,
        mrp,
        sellingPrice,
        initialStock,
        lowStockThreshold,
        isActive,
        isOrganic,
        isVeg,
        description,
        shortDescription,
        expiryDate,
        barcode,
        sku,
        uploadedImages,
      });

      Alert.alert('Success', `"${productName || 'Product'}" saved as draft!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const resetForm = () => {
    setProductName('');
    setCategory('');
    setCategoryId('');
    setSubCategory('');
    setSubCategoryId('');
    setCommissionRate(0);
    setBrand('');
    setUnitSize('');
    setMrp('');
    setSellingPrice('');
    setInitialStock('');
    setLowStockThreshold('10');
    setIsActive(true);
    setIsOrganic(false);
    setIsVeg(true);
    setDescription('');
    setShortDescription('');
    setExpiryDate('');
    setBarcode('');
    setSku('');
    setUploadedImages([]);
  };

  const discountPercentage =
    mrp && sellingPrice
      ? ((Number(mrp) - Number(sellingPrice)) / Number(mrp) * 100).toFixed(2)
      : '0';

  // Loading state for categories
  if (categoriesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4 text-sm">Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No categories found
  if (!categoryData || categoryData.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">📦</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">No Categories Available</Text>
          <Text className="text-gray-600 text-center">
            Categories need to be set up by the admin before you can add products.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-emerald-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity className="p-2 -ml-2" onPress={handleGoBack}>
          <Feather name="chevron-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-2">Add Product</Text>
      </View>

      {isCreating ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4 text-sm">Creating product...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View className="flex-1">
              {/* Product Image Section */}
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-600 mb-3">PRODUCT IMAGES *</Text>

                {uploadedImages.length === 0 ? (
                  <View className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center mb-3">
                    <Text className="text-3xl mb-2">📸</Text>
                    <Text className="text-gray-900 font-semibold text-sm text-center">
                      No images added
                    </Text>
                    <Text className="text-gray-600 text-xs text-center mt-1">
                      Add images to showcase your product
                    </Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    <View className="flex-row gap-2">
                      {uploadedImages.map((image, index) => (
                        <View key={index} className="relative">
                          <Image
                            source={{ uri: image.uri }}
                            className="w-32 h-32 rounded-lg border border-gray-200"
                            resizeMode="cover"
                          />
                          
                          {/* Remove button */}
                          <TouchableOpacity
                            onPress={() => handleRemoveImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1.5 shadow-md"
                          >
                            <Feather name="trash-2" size={12} color="#fff" />
                          </TouchableOpacity>
                          
                          {/* Primary badge */}
                          {image.isPrimary && (
                            <View className="absolute top-1 left-1 bg-emerald-500 rounded px-2 py-0.5">
                              <Text className="text-white text-xs font-semibold">Primary</Text>
                            </View>
                          )}
                          
                          {/* Image order */}
                          <View className="absolute bottom-1 right-1 bg-black/60 rounded px-2 py-0.5">
                            <Text className="text-white text-xs font-semibold">
                              {index + 1}/{uploadedImages.length}
                            </Text>
                          </View>
                          
                          {/* Actions row */}
                          <View className="mt-2 flex-row gap-1">
                            {!image.isPrimary && (
                              <TouchableOpacity
                                onPress={() => handleSetPrimaryImage(index)}
                                className="flex-1 bg-emerald-50 border border-emerald-200 rounded px-2 py-1"
                              >
                                <Text className="text-emerald-700 text-xs font-semibold text-center">
                                  Set Primary
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              onPress={() => handleEditAltText(index)}
                              className="flex-1 bg-gray-100 border border-gray-200 rounded px-2 py-1"
                            >
                              <Text className="text-gray-700 text-xs font-semibold text-center">
                                Edit Text
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <TouchableOpacity
                  onPress={handleUploadImage}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl py-3 items-center justify-center flex-row gap-2"
                >
                  <Feather name="upload" size={18} color="#059669" />
                  <Text className="text-emerald-700 font-semibold text-sm">
                    {uploadedImages.length === 0 ? 'Upload Product Images' : 'Add More Images'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Basic Information */}
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-600 mb-4">BASIC INFORMATION</Text>

                {/* Product Name */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name *</Text>
                  <TextInput
                    placeholder="Enter product name"
                    value={productName}
                    onChangeText={setProductName}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* SKU */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">SKU (Auto-generated)</Text>
                  <TextInput
                    placeholder="SKU will be auto-generated"
                    value={sku}
                    onChangeText={setSku}
                    className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-600 text-sm"
                    placeholderTextColor="#9ca3af"
                    editable={false}
                  />
                </View>

                {/* Category */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Category *</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(!selectedCategory)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className={`text-sm ${category ? 'text-gray-900' : 'text-gray-500'}`}>
                      {category || 'Select category'}
                    </Text>
                    <Feather
                      name={selectedCategory ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>

                  {selectedCategory && (
                    <View className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden ">
                      <ScrollView>
                        {categories?.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => {
                              setCategory(cat.name);
                              setCategoryId(cat.id);
                              setSelectedCategory(false);
                            }}
                            className={`px-4 py-3 border-b border-gray-100 ${
                              category === cat.name ? 'bg-emerald-50' : ''
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${
                                category === cat.name ? 'text-emerald-700' : 'text-gray-700'
                              }`}
                            >
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Sub Category */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Sub Category *</Text>

                  <TouchableOpacity
                    onPress={() => setSelectedSubCategory(!selectedSubCategory)}
                    disabled={!category}
                    className={`bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center justify-between ${
                      !category ? 'opacity-50' : ''
                    }`}
                  >
                    <Text className={`text-sm ${subCategory ? 'text-gray-900' : 'text-gray-500'}`}>
                      {subCategory || 'Select sub category'}
                    </Text>
                    <Feather
                      name={selectedSubCategory ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>

                  {selectedSubCategory && category && (
                    <View className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden ">
                      <ScrollView>
                        {categoriesWithSubcategories?.[category]?.map((sub) => (
                          <TouchableOpacity
                            key={sub.id}
                            onPress={() => {
                              setSubCategory(sub.name);
                              setSubCategoryId(sub.id);
                              setCommissionRate(sub.commission_rate);
                              setSelectedSubCategory(false);
                            }}
                            className={`px-4 py-3 border-b border-gray-100 ${
                              subCategory === sub.name ? 'bg-emerald-50' : ''
                            }`}
                          >
                            <View className="flex-row justify-between items-center">
                              <Text
                                className={`text-sm font-medium ${
                                  subCategory === sub.name ? 'text-emerald-700' : 'text-gray-700'
                                }`}
                              >
                                {sub.name}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                {sub.commission_rate}% commission
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Commission Rate Display */}
                {commissionRate > 0 && (
                  <View className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-blue-700 font-semibold text-sm">Commission Rate</Text>
                      <Text className="text-blue-700 font-bold text-sm">{commissionRate}%</Text>
                    </View>
                  </View>
                )}

                {/* Brand */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Brand (Optional)</Text>
                  <TextInput
                    placeholder="Enter brand name"
                    value={brand}
                    onChangeText={setBrand}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Unit / Size */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Unit / Size *</Text>
                  <TextInput
                    placeholder="e.g., 500ml, 1kg, 1pcs"
                    value={unitSize}
                    onChangeText={setUnitSize}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* Pricing Section */}
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-600 mb-4">PRICING</Text>

                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">MRP (₹) *</Text>
                    <TextInput
                      placeholder="0"
                      value={mrp}
                      onChangeText={setMrp}
                      keyboardType="decimal-pad"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Selling Price (₹) *
                    </Text>
                    <TextInput
                      placeholder="0"
                      value={sellingPrice}
                      onChangeText={setSellingPrice}
                      keyboardType="decimal-pad"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Discount Display */}
                {mrp && sellingPrice && Number(discountPercentage) > 0 && (
                  <View className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-emerald-700 font-semibold text-sm">Discount</Text>
                      <View className="bg-emerald-500 rounded-full px-3 py-1">
                        <Text className="text-white font-bold text-sm">{discountPercentage}%</Text>
                      </View>
                    </View>
                    <Text className="text-emerald-600 text-xs mt-1">
                      You save ₹{(Number(mrp) - Number(sellingPrice)).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stock & Availability */}
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-600 mb-4">
                  STOCK & AVAILABILITY
                </Text>

                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Initial Stock *</Text>
                    <TextInput
                      placeholder="0"
                      value={initialStock}
                      onChangeText={setInitialStock}
                      keyboardType="number-pad"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Low Stock Alert
                    </Text>
                    <TextInput
                      placeholder="10"
                      value={lowStockThreshold}
                      onChangeText={setLowStockThreshold}
                      keyboardType="number-pad"
                      className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Product Attributes */}
                <View className="mb-4 pt-3 border-t border-gray-100">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">Product Type</Text>

                  <View className="flex-row gap-3">
                    {/* Vegetarian Toggle */}
                    <View className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">🥬</Text>
                          <Text className="text-gray-900 font-semibold text-sm">Vegetarian</Text>
                        </View>
                        <Switch
                          value={isVeg}
                          onValueChange={setIsVeg}
                          trackColor={{ false: '#d1d5db', true: '#10b981' }}
                          thumbColor={isVeg ? '#059669' : '#6b7280'}
                        />
                      </View>
                    </View>

                    {/* Organic Toggle */}
                    <View className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">🌱</Text>
                          <Text className="text-gray-900 font-semibold text-sm">Organic</Text>
                        </View>
                        <Switch
                          value={isOrganic}
                          onValueChange={setIsOrganic}
                          trackColor={{ false: '#d1d5db', true: '#10b981' }}
                          thumbColor={isOrganic ? '#059669' : '#6b7280'}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Active Toggle */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                  <View>
                    <Text className="text-gray-900 font-semibold text-sm">Available for Sale</Text>
                    <Text className="text-gray-600 text-xs mt-1">
                      {isActive
                        ? 'Customers can order this product'
                        : 'Product is hidden from customers'}
                    </Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: '#d1d5db', true: '#10b981' }}
                    thumbColor={isActive ? '#059669' : '#6b7280'}
                  />
                </View>
              </View>

              {/* Description & Attributes */}
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
                <Text className="text-sm font-semibold text-gray-600 mb-4">PRODUCT DETAILS</Text>

                {/* Short Description */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Short Description
                  </Text>
                  <TextInput
                    placeholder="Brief product summary (shown in listings)"
                    value={shortDescription}
                    onChangeText={setShortDescription}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm min-h-[60px]"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Full Description */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Full Description
                  </Text>
                  <TextInput
                    placeholder="Detailed product description..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm min-h-[100px]"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Expiry Date */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Expiry Date / Shelf Life
                  </Text>
                  <TextInput
                    placeholder="e.g., 2024-12-31 or '5 days'"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Barcode */}
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Barcode (Optional)
                  </Text>
                  <TextInput
                    placeholder="Enter barcode"
                    value={barcode}
                    onChangeText={setBarcode}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View className="bg-white px-4 py-4 mb-4 mt-4 border-t border-gray-200">
                <TouchableOpacity
                  onPress={handleSaveAndPublish}
                  disabled={isCreating}
                  activeOpacity={0.7}
                  className={`w-full bg-emerald-500 rounded-xl py-4 items-center justify-center mb-3 ${
                    isCreating ? 'opacity-50' : ''
                  }`}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Save & Publish</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveAsDraft}
                  disabled={isCreating}
                  activeOpacity={0.7}
                  className={`w-full bg-gray-100 border border-gray-300 rounded-xl py-4 items-center justify-center ${
                    isCreating ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="text-gray-700 font-bold text-base">Save as Draft</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}