// hooks/queries/index.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/authStore';

// ==========================================
// 1. USER & PROFILE HOOKS
// ==========================================

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

  return useMutation({
    mutationFn: async (productData: any) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.products.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// ==========================================
// 5. CART HOOKS
// ==========================================

export function useCart() {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.cart.all(customerId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cart')
        .select('*, products(*, vendors(store_name))')
        .eq('customer_id', customerId);
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCartCount() {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.cart.count(customerId!),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!customerId,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('cart')
        .upsert({
          customer_id: session?.user?.id,
          product_id: productId,
          quantity,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all(session?.user?.id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.count(session?.user?.id!) });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('customer_id', session?.user?.id)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all(session?.user?.id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.count(session?.user?.id!) });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('customer_id', session?.user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all(session?.user?.id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.count(session?.user?.id!) });
    },
  });
}

// ==========================================
// 6. WISHLIST HOOKS
// ==========================================

export function useWishlist() {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.wishlist.all(customerId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*, vendors(store_name))')
        .eq('customer_id', customerId);
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useIsInWishlist(productId: string) {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.wishlist.check(customerId!, productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!customerId && !!productId,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ productId, isInWishlist }: { productId: string; isInWishlist: boolean }) => {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('customer_id', session?.user?.id)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            customer_id: session?.user?.id,
            product_id: productId,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all(session?.user?.id!) });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wishlist.check(session?.user?.id!, productId) 
      });
    },
  });
}

// Continue in next artifact...