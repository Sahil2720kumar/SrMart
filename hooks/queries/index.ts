// hooks/queries/index.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/authStore';
import { Customer, CustomerAddress, CustomerAddressInsert, CustomerAddressUpdate, DeliveryBoy, User, Vendor } from '@/types/users.types';

import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { randomUUID } from 'expo-crypto';
import { Category, Product, ProductImage, SubCategory } from '@/types/categories-products.types';
import { BankAccountType, VendorBankDetails } from '@/types/payments-wallets.types';
import {
  KycDocument,
  KycDocumentInsert,
  KycDocumentType,
  KycDocumentUpdate,
  KycUserType,
} from '@/types/documents-kyc.types';
import { Offer, ProductOffer } from '@/types/offers.types';
import { useProfileStore } from '@/store/profileStore';

// ==========================================
// 1. USER & PROFILE HOOKS
// ==========================================

export function useFetchUser() {
  const session = useAuthStore((state) => state.session);
  const id = session?.user?.id;

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('auth_id', id).single();
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

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('phone')
        .eq('auth_id', id)
        .single();


      if (error || userError) throw error || userError;
      return { ...data, phone: userData?.phone };
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
      const { data, error } = await supabase.from('vendors').select('*').eq('user_id', id).single();
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
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
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
      const { data, error } = await supabase
        .from('delivery_boys')
        .insert(deliveryBoyData)
        .select()
        .single();
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

// Update customer profile
export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const {setCustomerProfile,setUser}=useProfileStore()
  return useMutation({
    mutationFn: async (updates: any) => {
      const { data: customerData, error } = await supabase
        .from('customers')
        .update({
          first_name: updates.first_name,
          last_name: updates.last_name,
          date_of_birth: updates.date_of_birth,
          gender: updates.gender,
          profile_image: updates.profile_image,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session?.user?.id)
        .select('*')
        .single();
    
      setCustomerProfile(customerData)
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_id', session?.user?.id)
        .select('*')
        .single();
    
      setUser(userData)
      
      if (error) throw error;
      if (userError) throw userError;
    
      // ✅ Return SAME SHAPE as useCustomerProfile
      return {
        ...customerData,
        phone: userData?.phone,
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customers.byUser(session?.user?.id!),
      });
    },
  });
}

// Upload profile image
export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const updateProfile = useUpdateCustomerProfile();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (!session?.user?.id) throw new Error('No user session');

      try {
        // Delete old profile image if exists
        const { data: customerData } = await supabase
          .from('customers')
          .select('profile_image')
          .eq('user_id', session.user.id)
          .single();

        if (customerData?.profile_image) {
          // Extract the file path from the URL
          const urlParts = customerData.profile_image.split('/customers/');
          if (urlParts.length > 1) {
            const oldPath = urlParts[1];
            await supabase.storage.from('customers').remove([oldPath]);
          }
        }

        // Use File API to read image as base64
        const localFile = new File(imageUri);
        const base64 = await localFile.base64();

        // Generate unique filename
        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('customers')
          .upload(filePath, decode(base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('customers').getPublicUrl(filePath);

        return { publicUrl, filePath };
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    onSuccess: async ({ publicUrl }) => {
      // Update customer profile with new image URL
      await updateProfile.mutateAsync({
        profile_image: publicUrl,
        updated_at: new Date().toISOString(),
      });
      // Invalidate the query to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.byUser(session?.user?.id!),
      });
    },
  });
}


//==========================================
// 4. ADDRESS HOOKS
//==========================================

export const addressQueryKeys = {
  all: ['customer-addresses'] as const,
  byCustomer: (customerId: string) => ['customer-addresses', customerId] as const,
  byId: (id: string) => ['customer-address', id] as const,
};

// Get customer ID helper
const getCustomerId = async (userId: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data.user_id;
};

// Fetch ALL addresses — returns array
export function useCustomerAddresses() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: [...addressQueryKeys.byCustomer(session?.user?.id!), 'all'], // 👈 distinct key
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const customerId = await getCustomerId(session.user.id);
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CustomerAddress[];
    },
    enabled: !!session?.user?.id,
  });
}

// Fetch DEFAULT address only — returns single object
export function useCustomerDefaultAddresses() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: [...addressQueryKeys.byCustomer(session?.user?.id!), 'default'], // 👈 distinct key
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const customerId = await getCustomerId(session.user.id);
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_default', true)
        .maybeSingle(); // returns object | null, never array
      if (error) throw error;
      return data as CustomerAddress | null;
    },
    enabled: !!session?.user?.id,
  });
}
 
// Fetch single address by ID
export function useCustomerAddress(addressId: string) {
  return useQuery({
    queryKey: addressQueryKeys.byId(addressId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('id', addressId)
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    },
    enabled: !!addressId,
  });
}

// Create new address
export function useCreateAddress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (address: CustomerAddressInsert) => {
      if (!session?.user?.id) throw new Error('User not authenticated');


      
      const customerId = await getCustomerId(session.user.id);

      // If this is set as default, unset all other defaults first
      if (address.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', customerId);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: customerId,
          ...address,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: addressQueryKeys.byCustomer(session?.user?.id!) 
      });
    },
  });
}

// Update existing address
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: CustomerAddressUpdate 
    }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const customerId = await getCustomerId(session.user.id);

      // If setting as default, unset all other defaults first
      if (updates.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', customerId);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('customer_id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: addressQueryKeys.byCustomer(session?.user?.id!) 
      });
      queryClient.setQueryData(addressQueryKeys.byId(data.id), data);
    },
  });
}

// Delete address
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const customerId = await getCustomerId(session.user.id);

      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id)
        .eq('customer_id', customerId);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: addressQueryKeys.byCustomer(session?.user?.id!) 
      });
    },
  });
}

// Set address as default
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const customerId = await getCustomerId(session.user.id);

      // Unset all defaults first
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);

      // Set the selected address as default
      const { data, error } = await supabase
        .from('customer_addresses')
        .update({ 
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('customer_id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data as CustomerAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: addressQueryKeys.byCustomer(session?.user?.id!) 
      });
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
      let query = supabase.from('vendors').select('*, users(email, phone)');

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
        .eq('user_id', vendorId)
        .single();
      if (error) throw error;

      return data as Vendor;
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
        .select('*,users(email,phone)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.vendors.byUser(session?.user?.id!), data);
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
        .select(
          `
          *,
          products:products(count)
        `
        )
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // optional: flatten count
      return data.map((category) => ({
        ...category,
        product_count: category.products?.[0]?.count ?? 0,
      }));
    },
    staleTime: 1000 * 60 * 30,
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

/**
 * Get single subcategory details by ID
 */
export function useSubCategoryDetail(subCategoryId: string) {
  return useQuery({
    queryKey: queryKeys.subCategories.detail(subCategoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('id', subCategoryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!subCategoryId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Get all products for a specific subcategory

export function useProductsBySubCategory(subCategoryId: string) {
  return useQuery({
    queryKey: queryKeys.products.bySubCategory(subCategoryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sub_category_id', subCategoryId);

      if (error) throw error;
      return data;
    },
    enabled: !!subCategoryId,
    staleTime: 1000 * 60 * 5, // 5 minutes (products change more frequently)
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

      const { data, error } = await query.range(from, to).order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
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
        .select(
          `
          *,
          vendors(*),
          categories(name, slug),
          sub_categories(name, slug),
          product_images(*)
        `
        )
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product & {
        vendors: any;
        categories: Category;
        sub_categories: SubCategory;
        product_images: any[];
      };
    },
    enabled: !!productId,
  });
}


const limit = 500;
export function useInfiniteProducts(filters?: {
  categoryId?: string;
  subCategoryId?: string;
  search?: string;
  isAvailable?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      
      const from = pageParam * limit;
      const to = from + limit - 1;
 
      let query = supabase
        .from('products')
        .select('*, vendors(store_name, store_image), categories(name, slug)')
        .eq('is_available', true);

      if (filters?.categoryId && filters?.categoryId !== 'all') {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.subCategoryId) {
        query = query.eq('sub_category_id', filters.subCategoryId);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.isTrending) {
        query = query.eq('is_trending', true);
      }
      if (filters?.isBestSeller) {
        query = query.eq('is_best_seller', true);
      }
      if (filters?.isFeatured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query.range(from, to).order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('review_type', 'product')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useSimilarProducts(productId: string, categoryId: string, limit: number = 10) {
  return useQuery({
    queryKey: ['similar-products', productId, categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, vendors(store_name, store_image)')
        .eq('category_id', categoryId)
        .eq('is_available', true)
        .neq('id', productId)
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!productId && !!categoryId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  const uploadImage = async (
    imageUri: string,
    index: number,
    productSku: string
  ): Promise<string> => {
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
      const { data: urlData } = supabase.storage.from('vendors').getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: async ({
      product,
      productImages,
    }: {
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
      const uploadedImageUrls = await Promise.all(
        productImages.map((img, index) => uploadImage(img.uri, index, product.sku))
      );

      if (uploadedImageUrls.length === 0) {
        throw new Error('No images uploaded');
      }

      // Find primary image URL (first image by default)
      const primaryImageUrl =
        uploadedImageUrls[productImages.findIndex((img) => img.isPrimary)] || uploadedImageUrls[0];

      // Step 2: Create product record
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
      const imageRecords = productImages.map((img, index) => ({
        product_id: createdProduct.id,
        image_url: uploadedImageUrls[index],
        alt_text: img.altText,
        display_order: index + 1,
        is_primary: img.isPrimary,
      }));

      const { error: imagesError } = await supabase.from('product_images').insert(imageRecords);

      if (imagesError) {
        console.error('Product images error:', imagesError);
        // Product is already createt don't throw
        console.warn('Product created but images failed to save');
      }

      return createdProduct;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
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
        .select(
          'id,name,discount_price,stock_quantity,stock_status,is_available,image,categories(name)'
        )
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include stock status
      return data;
    },
    enabled: !!vendorId,
  });
}

export type ProductWithCategory = Product & {
  categories: {
    name: string;
  } | null;
  sub_categories: {
    name: string;
  } | null;
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
      updates,
    }: {
      productId: string;
      updates: Partial<Product>;
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
      queryClient.setQueryData(['vendor-product', vendorId, variables.productId], data);

      // Invalidate products list to refresh
      queryClient.invalidateQueries({
        queryKey: ['vendor-products', vendorId],
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
      const {
        data: { publicUrl },
      } = supabase.storage.from('vendors').getPublicUrl(uploadData.path);

      // Get the current highest display_order
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', productId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder =
        existingImages && existingImages.length > 0 ? existingImages[0].display_order + 1 : 0;

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
        queryKey: ['product-images', vendorId, variables.productId],
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
        await supabase.storage.from('vendors').remove([filePath]);
      }

      return { imageId };
    },
    onSuccess: (data, variables) => {
      // Invalidate product images cache
      queryClient.invalidateQueries({
        queryKey: ['product-images', vendorId, variables.productId],
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
        queryKey: ['product-images', vendorId, variables.productId],
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
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
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
        .select('*')
        .single();

      const { data: Product, error: ProductError } = await supabase
        .from('products')
        .update({ image: data?.image_url })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      return data as ProductImage;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', vendorId, variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['vendor-products', vendorId],
      });
    },
  });
}

// Inventory Quries and Mutations

/**
 * Hook to fetch all products for vendor's inventory
 */
export function useVendorInventory() {
  const vendorId = useAuthStore((state) => state.session?.user.id);

  return useQuery({
    queryKey: ['vendor-inventory', vendorId],
    queryFn: async (): Promise<Product[]> => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('products')
        .select('*,categories(name),sub_categories(name)')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as Product[];
    },
    enabled: !!vendorId,
  });
}

/**
 * Hook to update product stock quantity
 */
export function useUpdateProductStock() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      stockQuantity,
    }: {
      productId: string;
      stockQuantity: number;
    }) => {
      if (!vendorId) throw new Error('No vendor ID');
      if (stockQuantity < 0) throw new Error('Stock cannot be negative');

      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: stockQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('vendor_id', vendorId) // Ensure vendor can only update their own products
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      return data as Product;
    },
    onSuccess: (data, variables) => {
      // Invalidate inventory cache
      queryClient.invalidateQueries({
        queryKey: ['vendor-inventory', vendorId],
      });

      // Also invalidate specific product cache
      queryClient.invalidateQueries({
        queryKey: ['vendor-product', vendorId, variables.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ['vendor-product', vendorId],
      });
    },
  });
}

/**
 * Hook to bulk update stock for multiple products
 */
export function useBulkUpdateStock() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();
  //useage
  // await bulkUpdateMutation.mutateAsync([
  //   { productId: '1', stockQuantity: 100 },
  //   { productId: '2', stockQuantity: 50 },
  // ]);
  return useMutation({
    mutationFn: async (updates: Array<{ productId: string; stockQuantity: number }>) => {
      if (!vendorId) throw new Error('No vendor ID');

      const results = await Promise.all(
        updates.map(async ({ productId, stockQuantity }) => {
          if (stockQuantity < 0) throw new Error('Stock cannot be negative');

          // Get product to check threshold
          const { data: product } = await supabase
            .from('products')
            .select('low_stock_threshold')
            .eq('id', productId)
            .single();

          let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
          if (stockQuantity === 0) {
            stockStatus = 'out_of_stock';
          } else if (product && stockQuantity <= product.low_stock_threshold) {
            stockStatus = 'low_stock';
          }

          const { data, error } = await supabase
            .from('products')
            .update({
              stock_quantity: stockQuantity,
              stock_status: stockStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', productId)
            .eq('vendor_id', vendorId)
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );

      return results as Product[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['vendor-inventory', vendorId],
      });
    },
  });
}

/**
 * Hook to update product stock status to out of stock
 */
export function useUpdateProductStockToOutOfStock() {
  const vendorId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('vendor_id', vendorId) // Ensure vendor can only update their own products
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      return data as Product;
    },
    onSuccess: (data, variables) => {
      // Invalidate inventory cache
      queryClient.invalidateQueries({
        queryKey: ['vendor-inventory', vendorId],
      });

      // Also invalidate specific product cache
      queryClient.invalidateQueries({
        queryKey: ['vendor-product', vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ['vendor-product', vendorId, variables.productId],
      });
    },
  });
}

// Query Keys
export const bankQueryKeys = {
  all: ['bank-details'] as const,
  vendor: (vendorId: string) => [...bankQueryKeys.all, 'vendor', vendorId] as const,
  deliveryBoy: (deliveryBoyId: string) =>
    [...bankQueryKeys.all, 'delivery-boy', deliveryBoyId] as const,
};

// ==================== VENDOR BANK QUERIES ====================

/**
 * Hook to fetch vendor bank details
 * param vendorId - The vendor's ID
 */
export function useVendorBankDetails(vendorId: string) {
  return useQuery({
    queryKey: bankQueryKeys.vendor(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_bank_details')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle(); // Use maybeSingle to handle no results gracefully

      if (error) throw error;
      return data as VendorBankDetails | null;
    },
    enabled: !!vendorId,
  });
}

/**
 * Hook to add vendor bank details
 */
export function useAddVendorBankDetails() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: {
      vendor_id: string;
      account_holder_name: string;
      account_number: string;
      bank_name: string;
      ifsc_code: string;
      branch?: string;
      account_type?: BankAccountType;
      upi_id?: string;
      proof_image?: string;
    }) => {
      // Check if bank details already exist
      const { data: existing } = await supabase
        .from('vendor_bank_details')
        .select('id')
        .eq('vendor_id', input.vendor_id)
        .maybeSingle();

      if (existing) {
        throw new Error('Bank details already exist. Please update instead.');
      }

      const { data, error } = await supabase
        .from('vendor_bank_details')
        .insert({
          ...input,
          status: 'pending',
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as VendorBankDetails;
    },
    onSuccess: (data) => {
      // Invalidate and refetch vendor bank details
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.vendor(data.vendor_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to update vendor bank details
 */
export function useUpdateVendorBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      vendor_id: string;
      account_holder_name?: string;
      account_number?: string;
      bank_name?: string;
      ifsc_code?: string;
      branch?: string;
      account_type?: BankAccountType;
      upi_id?: string;
      proof_image?: string;
    }) => {
      const { id, vendor_id, ...updates } = input;

      const { data, error } = await supabase
        .from('vendor_bank_details')
        .update({
          ...updates,
          // Reset status to pending when updating
          status: 'pending',
          is_verified: false,
          verified_at: null,
          verified_by: null,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('vendor_id', vendor_id)
        .select()
        .single();

      if (error) throw error;
      return data as VendorBankDetails;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.vendor(data.vendor_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to delete vendor bank details
 */
export function useDeleteVendorBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; vendor_id: string }) => {
      const { error } = await supabase
        .from('vendor_bank_details')
        .delete()
        .eq('id', input.id)
        .eq('vendor_id', input.vendor_id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.vendor(variables.vendor_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.all,
      });
    },
  });
}

// ==================== DELIVERY BOY BANK QUERIES ====================

/**
 * Hook to fetch delivery boy bank details
 * @param deliveryBoyId - The delivery boy's ID
 */
export function useDeliveryBoyBankDetails(deliveryBoyId: string) {
  return useQuery({
    queryKey: bankQueryKeys.deliveryBoy(deliveryBoyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .select('*')
        .eq('delivery_boy_id', deliveryBoyId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!deliveryBoyId,
  });
}

/**
 * Hook to add delivery boy bank details
 */
export function useAddDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      delivery_boy_id: string;
      account_holder_name: string;
      account_number: string;
      bank_name: string;
      ifsc_code: string;
      branch?: string;
      account_type?: BankAccountType;
      upi_id?: string;
      proof_image?: string;
    }) => {
      // Check if bank details already exist
      const { data: existing } = await supabase
        .from('delivery_boy_bank_details')
        .select('id')
        .eq('delivery_boy_id', input.delivery_boy_id)
        .maybeSingle();

      if (existing) {
        throw new Error('Bank details already exist. Please update instead.');
      }

      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .insert({
          ...input,
          status: 'pending',
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.deliveryBoy(data.delivery_boy_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to update delivery boy bank details
 */
export function useUpdateDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      delivery_boy_id: string;
      account_holder_name?: string;
      account_number?: string;
      bank_name?: string;
      ifsc_code?: string;
      branch?: string;
      account_type?: BankAccountType;
      upi_id?: string;
      proof_image?: string;
    }) => {
      const { id, delivery_boy_id, ...updates } = input;

      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .update({
          ...updates,
          status: 'pending',
          is_verified: false,
          verified_at: null,
          verified_by: null,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('delivery_boy_id', delivery_boy_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.deliveryBoy(data.delivery_boy_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankQueryKeys.all,
      });
    },
  });
}

// Query Keys
export const kycQueryKeys = {
  all: ['kyc-documents'] as const,
  byUser: (userId: string, userType: KycUserType) =>
    [...kycQueryKeys.all, 'user', userId, userType] as const,
  byDocument: (userId: string, documentType: KycDocumentType) =>
    [...kycQueryKeys.all, 'document', userId, documentType] as const,
  single: (id: string) => [...kycQueryKeys.all, 'single', id] as const,
};

// ==================== FETCH QUERIES ====================

/**
 * Hook to fetch all KYC documents for a user
 * @param userId - The user's ID
 * @param userType - 'vendor' or 'delivery_boy'
 */
export function useKycDocuments(userId: string, userType: KycUserType) {
  return useQuery({
    queryKey: kycQueryKeys.byUser(userId, userType),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KycDocument[];
    },
    enabled: !!userId && !!userType,
  });
}

/**
 * Hook to fetch a single KYC document by type
 * @param userId - The user's ID
 * @param documentType - Type of document
 */
export function useKycDocumentByType(userId: string, documentType: KycDocumentType) {
  return useQuery({
    queryKey: kycQueryKeys.byDocument(userId, documentType),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .maybeSingle();

      if (error) throw error;
      return data as KycDocument | null;
    },
    enabled: !!userId && !!documentType,
  });
}

/**
 * Hook to fetch a single KYC document by ID
 * @param documentId - The document's ID
 */
export function useKycDocument(documentId: string) {
  return useQuery({
    queryKey: kycQueryKeys.single(documentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data as KycDocument;
    },
    enabled: !!documentId,
  });
}

/**
 * Hook to get KYC verification summary
 * @param userId - The user's ID
 * @param userType - 'vendor' or 'delivery_boy'
 */
export function useKycSummary(userId: string, userType: KycUserType) {
  const { data: documents } = useKycDocuments(userId, userType);

  const summary = {
    total: documents?.length || 0,
    verified:
      documents?.filter((d) => d.status === 'verified' || d.status === 'approved').length || 0,
    pending: documents?.filter((d) => d.status === 'pending').length || 0,
    rejected: documents?.filter((d) => d.status === 'rejected').length || 0,
    notUploaded: documents?.filter((d) => d.status === 'not_uploaded').length || 0,
    required: documents?.filter((d) => d.is_required).length || 0,
    requiredVerified:
      documents?.filter(
        (d) => d.is_required && (d.status === 'verified' || d.status === 'approved')
      ).length || 0,
    progress: 0,
    isComplete: false,
  };

  if (summary.required > 0) {
    summary.progress = Math.round((summary.requiredVerified / summary.required) * 100);
    summary.isComplete = summary.requiredVerified === summary.required;
  }

  return summary;
}

// ==================== MUTATIONS ====================

/**
 * Hook to upload/add a new KYC document with base64 image
 */
export function useUploadKycDocument() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: {
      document: KycDocumentInsert;
      imageUri: string;
      base64: string;
    }) => {
      try {
        let documentUrl = input.document.document_url;

        // Upload image to storage

        // Extract file extension from URI
        const fileExt = input.imageUri.split('.').pop() || 'jpg';
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = `${session?.user.id}/kycDocuments/${fileName}`;

        // Upload to Supabase Storage using base64
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vendors')
          .upload(filePath, decode(input.base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }


        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('vendors').getPublicUrl(filePath);

        documentUrl = publicUrl;

        // Check if document already exists for this user and type
        const { data: existing } = await supabase
          .from('kyc_documents')
          .select('id')
          .eq('user_id', input.document.user_id)
          .eq('document_type', input.document.document_type)
          .maybeSingle();

        if (existing) {
          // Update existing document
          const { data, error } = await supabase
            .from('kyc_documents')
            .update({
              ...input.document,
              document_url: documentUrl,
              status: 'pending',
              uploaded_date: new Date().toISOString(),
              verified_date: null,
              verified_by: null,
              rejection_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return data as KycDocument;
        } else {
          // Insert new document
          const { data, error } = await supabase
            .from('kyc_documents')
            .insert({
              ...input.document,
              document_url: documentUrl,
              status: 'pending',
              uploaded_date: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          return data as KycDocument;
        }
      } catch (error: any) {
        console.error('Upload mutation error:', error);
        throw new Error(error.message || 'Upload failed');
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byUser(data.user_id, data.user_type),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byDocument(data.user_id, data.document_type),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to update KYC document metadata (without file)
 */
export function useUpdateKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; updates: KycDocumentUpdate }) => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({
          ...input.updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as KycDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byUser(data.user_id, data.user_type),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.single(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to delete a KYC document
 */
export function useDeleteKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      userId: string;
      userType: KycUserType;
      documentUrl?: string;
    }) => {
      // Delete file from storage if exists
      if (input.documentUrl) {
        // Extract file path from URL
        // URL format: https://.../storage/v1/object/public/vendors/{vendorId}/kycDocuments/{filename}
        const urlParts = input.documentUrl.split('/vendors/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1]; // {vendorId}/kycDocuments/{filename}

          const { error: storageError } = await supabase.storage.from('vendors').remove([filePath]);

          // Don't throw on storage error, continue with DB deletion
          if (storageError) {
            console.warn('Failed to delete file from storage:', storageError);
          }
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('kyc_documents')
        .delete()
        .eq('id', input.id)
        .eq('user_id', input.userId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byUser(variables.userId, variables.userType),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to replace a KYC document (delete old + upload new) with base64 image
 */
export function useReplaceKycDocument() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: {
      documentId: string;
      userId: string;
      userType: KycUserType;
      oldDocumentUrl?: string;
      newDocument: KycDocumentInsert;
      imageUri: string;
      base64: string;
    }) => {
      try {
        // Delete old file from storage if exists
        if (input.oldDocumentUrl) {
          const urlParts = input.oldDocumentUrl.split('/vendors/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];

            await supabase.storage.from('vendors').remove([filePath]);
          }
        }

        // Extract file extension
        const fileExt = input.imageUri.split('.').pop() || 'jpg';
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = `${session?.user.id}/kycDocuments/${fileName}`;


        // Upload to Supabase Storage using base64
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vendors')
          .upload(filePath, decode(input.base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }


        const {
          data: { publicUrl },
        } = supabase.storage.from('vendors').getPublicUrl(filePath);

        // Update document record
        const { data, error } = await supabase
          .from('kyc_documents')
          .update({
            ...input.newDocument,
            document_url: publicUrl,
            status: 'pending',
            uploaded_date: new Date().toISOString(),
            verified_date: null,
            verified_by: null,
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.documentId)
          .select()
          .single();

        if (error) throw error;
        return data as KycDocument;
      } catch (error: any) {
        console.error('Replace document error:', error);
        throw new Error(`Replace failed: ${error.message || 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byUser(data.user_id, data.user_type),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.single(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.all,
      });
    },
  });
}

// ==================== ADMIN MUTATIONS ====================

/**
 * Hook for admin to verify/approve a KYC document
 */
export function useVerifyKycDocument() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: { documentId: string; status: 'verified' | 'approved' }) => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({
          status: input.status,
          verified_date: new Date().toISOString(),
          verified_by: session?.user?.id,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.documentId)
        .select()
        .single();

      if (error) throw error;
      return data as KycDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byUser(data.user_id, data.user_type),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.single(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.all,
      });
    },
  });
}

/**
 * Hook for admin to reject a KYC document
 */
export function useRejectKycDocument() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: { documentId: string; rejectionReason: string }) => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          rejection_reason: input.rejectionReason,
          verified_date: new Date().toISOString(),
          verified_by: session?.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.documentId)
        .select()
        .single();

      if (error) throw error;
      return data as KycDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byUser(data.user_id, data.user_type),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.single(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.all,
      });
    },
  });
}

// ==================== UTILITY HOOKS ====================

/**
 * Hook to check if all required documents are verified
 */
export function useIsKycComplete(userId: string, userType: KycUserType) {
  const summary = useKycSummary(userId, userType);
  return summary.isComplete;
}

/**
 * Hook to get KYC status for a specific document type
 */
export function useDocumentStatus(userId: string, documentType: KycDocumentType) {
  const { data: document } = useKycDocumentByType(userId, documentType);

  return {
    status: document?.status || 'not_uploaded',
    isVerified: document?.status === 'verified' || document?.status === 'approved',
    isPending: document?.status === 'pending',
    isRejected: document?.status === 'rejected',
    rejectionReason: document?.rejection_reason,
    document,
  };
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const offerQueryKeys = {
  offers: {
    all: ['offers'] as const,
    active: ['offers', 'active'] as const,
    detail: (offerId: string) => ['offers', 'detail', offerId] as const,
  },
  offerProducts: {
    // products linked via offer_products junction (applicable_to = 'product')
    byOffer: (offerId: string) => ['offer-products', offerId] as const,
  },
  products: {
    byCategory: (categoryId: string) => ['products', 'by-category', categoryId] as const,
    byVendor: (vendorId: string) => ['products', 'by-vendor', vendorId] as const,
  },
  productOffers: {
    // all offers that apply to a given product (junction + category + vendor)
    byProduct: (productId: string) => ['product-offers', productId] as const,
  },
} as const;

// ─── 1. useOffers — All active offers (AllOffersScreen) ─────────────────────

// ── helpers: count products for a single offer based on its applicable_to ──

async function countByCategory(categoryId: string): Promise<number> {
  // 1. resolve all active sub_category ids under this category
  const { data: subCats, error: e1 } = await supabase
    .from('sub_categories')
    .select('id')
    .eq('category_id', categoryId)
    .eq('is_active', true);

  if (e1) throw e1;
  if (subCats.length === 0) return 0;

  // 2. count products that belong to any of those sub_categories
  const { count, error: e2 } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_available', true)
    // .neq("stock_status", "out_of_stock")
    .in(
      'sub_category_id',
      subCats.map((s: any) => s.id)
    );

  if (e2) throw e2;
  return count ?? 0;
}

async function countByVendor(vendorId: string): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('is_available', true);
  // .neq("stock_status", "out_of_stock")

  if (error) throw error;
  return count ?? 0;
}

async function countByOfferProducts(offerId: string): Promise<number> {
  // count rows in the junction table for this offer
  const { count, error } = await supabase
    .from('offer_products')
    .select('id', { count: 'exact', head: true })
    .eq('offer_id', offerId);

  if (error) throw error;
  return count ?? 0;
}

async function getProductCount(offer: {
  id: string;
  applicable_to: string;
  applicable_id?: string | null;
}): Promise<number> {
  switch (offer.applicable_to) {
    case 'category':
      return offer.applicable_id ? countByCategory(offer.applicable_id) : 0;
    case 'vendor':
      return offer.applicable_id ? countByVendor(offer.applicable_id) : 0;
    case 'product':
      return countByOfferProducts(offer.id);
    default:
      return 0;
  }
}

// ─── 1. useOffers — All active offers with live product counts ──────────────

export function useOffers() {
  return useQuery({
    queryKey: offerQueryKeys.offers.active,
    queryFn: async () => {
      // Phase 1: fetch all active offers
      const { data, error } = await supabase
        .from('offers')
        .select(
          `
          id,
          title,
          description,
          discount,
          offer_type,
          discount_type,
          discount_value,
          applicable_to,
          applicable_id,
          start_date,
          end_date,
          is_active,
          display_order,
          bg_color,
          tag,
          banner_image
        `
        )
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Phase 2: batch-resolve product counts in parallel
      //   • category / vendor  → dedupe by applicable_id (same target = same count)
      //   • product            → keyed by offer.id (each offer has its own junction rows)

      const sharedIds = new Map<
        string,
        { id: string; applicable_to: string; applicable_id: string }
      >();
      const productOfferIds: string[] = [];

      for (const offer of data) {
        if (offer.applicable_to === 'product') {
          productOfferIds.push(offer.id);
        } else if (offer.applicable_id && !sharedIds.has(offer.applicable_id)) {
          sharedIds.set(offer.applicable_id, {
            id: offer.id,
            applicable_to: offer.applicable_to,
            applicable_id: offer.applicable_id,
          });
        }
      }

      const countMap = new Map<string, number>();

      // shared counts (category / vendor) — deduplicated
      await Promise.all(
        Array.from(sharedIds.values()).map(async (entry) => {
          const count = await getProductCount(entry);
          countMap.set(entry.applicable_id, count);
        })
      );

      // junction counts (product) — one per offer
      await Promise.all(
        productOfferIds.map(async (offerId) => {
          const count = await countByOfferProducts(offerId);
          countMap.set(offerId, count);
        })
      );

      // Phase 3: attach the resolved count to each offer
      return data.map((offer: any) => ({
        ...offer,
        item_count:
          offer.applicable_to === 'product'
            ? (countMap.get(offer.id) ?? 0)
            : (countMap.get(offer.applicable_id) ?? 0),
      })) as Offer[];
    },
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

// ─── 2. useOfferDetail — Single offer row (OfferScreen header) ──────────────

export function useOfferDetail(offerId: string) {
  return useQuery({
    queryKey: offerQueryKeys.offers.detail(offerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as Offer;
    },
    enabled: !!offerId,
    staleTime: 1000 * 60 * 10,
  });
}

// ─── 3. useOfferProductsByCategory — Products via category (applicable_to = 'category') ─

export function useOfferProductsByCategory(categoryId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: offerQueryKeys.products.byCategory(categoryId),
    queryFn: async () => {
      // resolve all active sub_category ids under this category
      const { data: subCats, error: subErr } = await supabase
        .from('sub_categories')
        .select('id')
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (subErr) throw subErr;
      if (subCats.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          short_description,
          price,
          discount_price,
          discount_percentage,
          unit,
          stock_quantity,
          stock_status,
          image,
          is_available,
          is_trending,
          is_best_seller,
          is_featured,
          is_organic,
          is_veg,
          rating,
          review_count,
          category_id,
          sub_category_id,
          vendor_id
        `
        )
        .eq('is_available', true)
        // .neq("stock_status", "out_of_stock")
        .in(
          'sub_category_id',
          subCats.map((s: any) => s.id)
        )
        .order('is_featured', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!categoryId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── 4. useOfferProductsByVendor — Products via vendor (applicable_to = 'vendor') ─

export function useOfferProductsByVendor(vendorId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: offerQueryKeys.products.byVendor(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          short_description,
          price,
          discount_price,
          discount_percentage,
          unit,
          stock_quantity,
          stock_status,
          image,
          is_available,
          is_trending,
          is_best_seller,
          is_featured,
          is_organic,
          is_veg,
          rating,
          review_count,
          category_id,
          sub_category_id,
          vendor_id
        `
        )
        .eq('vendor_id', vendorId)
        .eq('is_available', true)
        // .neq("stock_status", "out_of_stock")
        .order('is_featured', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: enabled && !!vendorId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── 5. useOfferProductsByJunction — Products via offer_products (applicable_to = 'product') ─

export function useOfferProductsByJunction(offerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: offerQueryKeys.offerProducts.byOffer(offerId),
    queryFn: async () => {
      // 1. get all product_ids linked to this offer
      const { data: rows, error: e1 } = await supabase
        .from('offer_products')
        .select('product_id')
        .eq('offer_id', offerId);

      if (e1) throw e1;
      if (rows.length === 0) return [];

      const productIds = rows.map((r: any) => r.product_id);

      // 2. fetch the actual products (only available + in stock)
      const { data, error: e2 } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          short_description,
          price,
          discount_price,
          discount_percentage,
          unit,
          stock_quantity,
          stock_status,
          image,
          is_available,
          is_trending,
          is_best_seller,
          is_featured,
          is_organic,
          is_veg,
          rating,
          review_count,
          category_id,
          sub_category_id,
          vendor_id
        `
        )
        .in('id', productIds)
        .eq('is_available', true);
      // .neq("stock_status", "out_of_stock")

      if (e2) throw e2;
      return data;
    },
    enabled: enabled && !!offerId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── 6. useOfferProductsFetcher — Orchestrator hook (used inside OfferScreen) ─
//
// Reads offer.applicable_to and conditionally enables exactly ONE of the
// three product queries.  Consumers get a single { products, isLoading, error }.

export function useOfferProductsFetcher(offer: Offer | undefined) {
  const applicableTo = offer?.applicable_to;
  const applicableId = offer?.applicable_id;

  // 'category' → products via sub_categories.category_id
  const categoryEnabled = !!offer && applicableTo === 'category' && !!applicableId;
  const categoryQuery = useOfferProductsByCategory(applicableId ?? '', categoryEnabled);

  // 'vendor' → products via vendor_id
  const vendorEnabled = !!offer && applicableTo === 'vendor' && !!applicableId;
  const vendorQuery = useOfferProductsByVendor(applicableId ?? '', vendorEnabled);

  // 'product' → products via offer_products junction table
  const junctionEnabled = !!offer && applicableTo === 'product';
  const junctionQuery = useOfferProductsByJunction(offer?.id ?? '', junctionEnabled);

  // Pick the active query result
  if (categoryEnabled)
    return {
      products: categoryQuery.data ?? [],
      isLoading: categoryQuery.isLoading,
      error: categoryQuery.error,
    };
  if (vendorEnabled)
    return {
      products: vendorQuery.data ?? [],
      isLoading: vendorQuery.isLoading,
      error: vendorQuery.error,
    };
  if (junctionEnabled)
    return {
      products: junctionQuery.data ?? [],
      isLoading: junctionQuery.isLoading,
      error: junctionQuery.error,
    };

  // offer not yet loaded
  return { products: [], isLoading: true, error: null };
}

// ─── 7. useProductOffers — All offers that apply to a given product ─────────
//        (utility; useful on a product-detail page)
//        Sources: offer_products junction + category-scoped + vendor-scoped

export function useProductOffers(productId: string) {
  return useQuery({
    queryKey: offerQueryKeys.productOffers.byProduct(productId),
    queryFn: async () => {
      // ── 1. offers where this product is in the junction table ──
      const { data: junctionRows, error: e1 } = await supabase
        .from('offer_products')
        .select('offer_id')
        .eq('product_id', productId);

      if (e1) throw e1;

      let junctionOffers: any[] = [];
      if (junctionRows.length > 0) {
        const offerIds = junctionRows.map((r: any) => r.offer_id);
        const { data, error: e2 } = await supabase
          .from('offers')
          .select('id, title, discount_type, discount_value, offer_type')
          .in('id', offerIds)
          .eq('is_active', true);

        if (e2) throw e2;
        junctionOffers = data;
      }

      // ── 2. offers scoped to the product's category ──
      const { data: product, error: e3 } = await supabase
        .from('products')
        .select('category_id, sub_category_id, vendor_id')
        .eq('id', productId)
        .single();

      if (e3) throw e3;

      const { data: categoryOffers, error: e4 } = await supabase
        .from('offers')
        .select('id, title, discount_type, discount_value, offer_type')
        .eq('applicable_to', 'category')
        .eq('applicable_id', product.category_id)
        .eq('is_active', true);

      if (e4) throw e4;

      // ── 3. offers scoped to the product's vendor ──
      let vendorOffers: any[] = [];
      if (product.vendor_id) {
        const { data: vOffers, error: e5 } = await supabase
          .from('offers')
          .select('id, title, discount_type, discount_value, offer_type')
          .eq('applicable_to', 'vendor')
          .eq('applicable_id', product.vendor_id)
          .eq('is_active', true);

        if (e5) throw e5;
        vendorOffers = vOffers;
      }

      // ── merge & dedupe by offer id ──
      const seen = new Set<string>();
      const unique: ProductOffer[] = [];
      for (const o of [...junctionOffers, ...categoryOffers, ...vendorOffers]) {
        if (!seen.has(o.id)) {
          seen.add(o.id);
          unique.push(o as ProductOffer);
        }
      }

      return unique;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
}
