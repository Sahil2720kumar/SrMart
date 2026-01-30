// hooks/queries/index.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/authStore';
import { Customer, DeliveryBoy, User, Vendor } from '@/types/users.types';

import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { randomUUID } from 'expo-crypto';
import { Product, ProductImage } from '@/types/categories-products.types';


// ==========================================
// 1. USER & PROFILE HOOKS
// ==========================================

export function useFetchUser() {
  const session = useAuthStore((state) => state.session);
  const id = session?.user?.id;

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', id)
        .single()
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCustomerProfile(userId?: string) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  return useQuery({
    queryKey: queryKeys.customers.byUser(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', id)
        .single();
      if (error) throw error;
      return data;
    },

    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useVendorProfile(userId?: string) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  return useQuery({
    queryKey: queryKeys.vendors.byUser(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useDeliveryBoyProfile(userId?: string) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  return useQuery({
    queryKey: queryKeys.deliveryBoys.byUser(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('user_id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}


export function useCreateCustomerProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  return useMutation({
    mutationFn: async (customerData: Customer) => {
      const { data, error } = await supabase.from('customers').insert(customerData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.customers.byUser(session?.user?.id!), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
    onError: (error) => {
      console.error('Error creating customer profile:', error);
    },
  });
}

export function useCreateVendorProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  return useMutation({
    mutationFn: async (vendorData: Vendor) => {
      const { data, error } = await supabase.from('vendors').insert(vendorData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(session?.user?.id!), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
    onError: (error) => {
      console.error('Error creating vendor profile:', error);
    },
  });
}


export function useCreateDeliveryBoyProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  return useMutation({
    mutationFn: async (deliveryBoyData: DeliveryBoy) => {
      const { data, error } = await supabase.from('delivery_boys').insert(deliveryBoyData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.deliveryBoys.byUser(session?.user?.id!), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveryBoys.all });
    },
    onError: (error) => {
      console.error('Error creating delivery boy profile:', error);
    },
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('user_id', session?.user?.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.customers.byUser(session?.user?.id!),
        data
      );
    },
  });
}

// ==========================================
// 2. VENDOR HOOKS
// ==========================================

export function useVendors(filters?: {
  city?: string;
  isVerified?: boolean;
  isOpen?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.vendors.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('vendors')
        .select('*, users(email, phone)');

      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.isVerified !== undefined) {
        query = query.eq('is_verified', filters.isVerified);
      }
      if (filters?.isOpen !== undefined) {
        query = query.eq('is_open', filters.isOpen);
      }
      if (filters?.search) {
        query = query.ilike('store_name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('rating', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useVendorDetail(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*, users(email, phone)')
        .eq('id', vendorId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

export function useUpdateVendorProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('user_id', session?.user?.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.vendors.byUser(session?.user?.id!),
        data
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

// ==========================================
// 3. CATEGORY HOOKS
// ==========================================

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCategoriesWithSubCategories() {
  return useQuery({
    queryKey: queryKeys.categories.allWithSubCategories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug,sub_categories(id,name,slug,commission_rate)')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useCategoryDetail(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });
}

export function useSubCategories(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.subCategories.byCategory(categoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 15,
  });
}

// ==========================================
// 4. PRODUCT HOOKS
// ==========================================

export function useProducts(filters?: {
  vendorId?: string;
  categoryId?: string;
  subCategoryId?: string;
  search?: string;
  isAvailable?: boolean;
  isTrending?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, vendors(store_name, store_image), categories(name)');

      if (filters?.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.subCategoryId) {
        query = query.eq('sub_category_id', filters.subCategoryId);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.isAvailable !== undefined) {
        query = query.eq('is_available', filters.isAvailable);
      }
      if (filters?.isTrending) {
        query = query.eq('is_trending', true);
      }

      const limit = filters?.limit || 20;
      const page = filters?.page || 0;
      const from = page * limit;
      const to = from + limit - 1;

      const { data, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors(*),
          categories(name, slug),
          sub_categories(name, slug),
          product_images(*)
        `)
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useInfiniteProducts(filters?: any) {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const from = pageParam * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('products')
        .select('*, vendors(store_name, store_image)')
        .eq('is_available', true);

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
}


export function useCreateProduct() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  const uploadImage = async (imageUri: string, index: number, productSku: string): Promise<string> => {
    try {
      // New API - replace FileSystem.readAsStringAsync
      const localFile = new File(imageUri);
      const base64 = await localFile.base64();

      // Generate unique file path
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${randomUUID()}.${fileExt}`;
      const filePath = `${session?.user.id}/products/${productSku}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vendors')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error(`Error uploading image ${index}:`, error);
        throw new Error(`Failed to upload image ${index + 1}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vendors')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: async ({ product, productImages }: {
      product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'image'>;
      productImages: Array<{
        uri: string;
        altText: string;
        isPrimary: boolean;
      }>;
    }) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Step 1: Upload all images
      console.log('Uploading images...');
      const uploadedImageUrls = await Promise.all(
        productImages.map((img, index) => uploadImage(img.uri, index, product.sku))
      );

      if (uploadedImageUrls.length === 0) {
        throw new Error('No images uploaded');
      }

      // Find primary image URL (first image by default)
      const primaryImageUrl =
        uploadedImageUrls[productImages.findIndex((img) => img.isPrimary)] ||
        uploadedImageUrls[0];

      // Step 2: Create product record
      console.log('Creating product...');
      const productData = {
        vendor_id: product.vendor_id,
        category_id: product.category_id,
        sub_category_id: product.sub_category_id || null,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        description: product.description || null,
        short_description: product.short_description || null,
        price: product.price,
        discount_price: product.discount_price || null,
        discount_percentage: product.discount_percentage,
        unit: product.unit,
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        stock_status: product.stock_status,
        image: primaryImageUrl, // Set primary image
        is_available: product.is_available,
        is_trending: product.is_trending,
        is_best_seller: product.is_best_seller,
        is_featured: product.is_featured,
        is_organic: product.is_organic,
        is_veg: product.is_veg,
        commission_type: product.commission_type,
        commission_rate: product.commission_rate || null,
        attributes: product.attributes,
        rating: 0,
        review_count: 0,
        expiry_date: product.expiry_date || null,
        barcode: product.barcode || null,
      };

      const { data: createdProduct, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) {
        console.error('Product creation error:', productError);
        throw new Error(productError.message || 'Failed to create product');
      }

      // Step 3: Create product_images records
      console.log('Creating product images...');
      const imageRecords = productImages.map((img, index) => ({
        product_id: createdProduct.id,
        image_url: uploadedImageUrls[index],
        alt_text: img.altText,
        display_order: index + 1,
        is_primary: img.isPrimary,
      }));

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageRecords);

      if (imagesError) {
        console.error('Product images error:', imagesError);
        // Product is already created, so we log but don't throw
        console.warn('Product created but images failed to save');
      }

      return createdProduct;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      console.log('Product created successfully:', data.id);
    },
    onError: (error: Error) => {
      console.error('Product creation failed:', error);
    },
  });
}


export function useProductsByVendorId() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('products')
        .select('id,name,discount_price,stock_quantity,stock_status,is_available,image,categories(name)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include stock status
      return data
    },
    enabled: !!vendorId,
  });
}

export type ProductWithCategory = Product & {
  categories: {
    name: string;

  } | null;
  sub_categories: {
    name: string
  } | null
};

/**
 * Hook to fetch product details by vendor ID and product ID
 */
export function useProductDetailsByVendorIdAndProductId(productId: string) {
  const vendorId = useAuthStore((state) => state.session?.user.id);

  return useQuery({
    queryKey: ['vendor-product', vendorId, productId],
    queryFn: async (): Promise<ProductWithCategory> => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name),sub_categories(name)')
        .eq('vendor_id', vendorId)
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      return data as ProductWithCategory;
    },
    enabled: !!vendorId && !!productId,
  });
}

/**
 * Hook to fetch all images for a specific product
 */
export function useProductImagesByProductId(productId: string) {
  const vendorId = useAuthStore((state) => state.session?.user.id);

  return useQuery({
    queryKey: ['product-images', vendorId, productId],
    queryFn: async (): Promise<ProductImage[]> => {
      if (!vendorId) throw new Error('No vendor ID');
      if (!productId) throw new Error('No product ID');

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return data as ProductImage[];
    },
    enabled: !!vendorId && !!productId,
  });
}


/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      updates
    }: {
      productId: string;
      updates: Partial<Product>
    }) => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('vendor_id', vendorId) // Ensure vendor can only update their own products
        .select('*, categories(name), sub_categories(name)')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      return data as ProductWithCategory;
    },
    onSuccess: (data, variables) => {
      // Update the specific product detail cache
      queryClient.setQueryData(
        ['vendor-product', vendorId, variables.productId],
        data
      );

      // Invalidate products list to refresh
      queryClient.invalidateQueries({
        queryKey: ['vendor-products', vendorId]
      });
    },
  });
}

/**
 * Hook to upload product image to Supabase Storage and create database record
 */
export function useUploadProductImage() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageUri,
      isPrimary = false,
    }: {
      productId: string;
      imageUri: string;
      isPrimary?: boolean;
    }) => {
      if (!vendorId) throw new Error('No vendor ID');


      // You'll need to get the SKU from the product
      // For now, we'll fetch it
      const { data: product } = await supabase
        .from('products')
        .select('sku')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Product not found');

      // New API - replace FileSystem.readAsStringAsync
      const localFile = new File(imageUri);
      const base64 = await localFile.base64();

      // Generate unique file path
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${randomUUID()}.${fileExt}`;
      const filePath = `${vendorId}/products/${product.sku}/${fileName}`;

      // Upload to Supabase Storage (bucket: vendors)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendors')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vendors')
        .getPublicUrl(uploadData.path);

      // Get the current highest display_order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingImages && existingImages.length > 0
        ? existingImages[0].display_order + 1
        : 0;

      // If this is marked as primary, unset other primary images first
      if (isPrimary) {
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);
      }

      // Create database record
      const { data: imageRecord, error: dbError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          display_order: nextDisplayOrder,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from('vendors').remove([fileName]);
        throw dbError;
      }

      return imageRecord as ProductImage;
    },
    onSuccess: (data, variables) => {
      // Invalidate product images cache
      queryClient.invalidateQueries({
        queryKey: ['product-images', vendorId, variables.productId]
      });
    },
  });
}

/**
 * Hook to delete a product image
 */
export function useDeleteProductImage() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageId,
      imageUrl,
    }: {
      productId: string;
      imageId: string;
      imageUrl: string;
    }) => {
      if (!vendorId) throw new Error('No vendor ID');

      // Delete from database first
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId)
        .eq('product_id', productId); // Extra safety check

      if (dbError) throw dbError;

      // Extract file path from URL
      // URL format: https://{project}.supabase.co/storage/v1/object/public/vendors/{vendorId}/products/{sku}/{uuid}.jpeg
      const urlParts = imageUrl.split('/vendors/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];

        // Delete from storage (don't throw error if this fails, as DB record is already deleted)
        await supabase.storage
          .from('vendors')
          .remove([filePath]);
      }

      return { imageId };
    },
    onSuccess: (data, variables) => {
      // Invalidate product images cache
      queryClient.invalidateQueries({
        queryKey: ['product-images', vendorId, variables.productId]
      });
    },
  });
}

/**
 * Hook to update image display order
 */
export function useUpdateImageOrder() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageId,
      newDisplayOrder,
    }: {
      productId: string;
      imageId: string;
      newDisplayOrder: number;
    }) => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('product_images')
        .update({ display_order: newDisplayOrder })
        .eq('id', imageId)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;

      return data as ProductImage;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', vendorId, variables.productId]
      });
    },
  });
}

/**
 * Hook to set an image as primary
 */
export function useSetPrimaryImage() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageId,
    }: {
      productId: string;
      imageId: string;
    }) => {
      if (!vendorId) throw new Error('No vendor ID');

      // First, unset all other primary images for this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Then set this one as primary
      const { data, error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;

      return data as ProductImage;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', vendorId, variables.productId]
      });
    },
  });
}