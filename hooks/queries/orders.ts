// hooks/queries/orders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/authStore';

// ==========================================
// ORDER HOOKS
// ==========================================

export function useOrders(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.orders.byCustomer(userId!, filters),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          vendors(store_name, store_image),
          customer_addresses(*),
          delivery_boys(first_name, last_name)
        `)
        .eq('customer_id', userId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useVendorOrders(filters?: { status?: string }) {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.orders.byVendor(userId!, filters),
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers(first_name, last_name),
          customer_addresses(*),
          delivery_boys(first_name, last_name)
        `)
        .eq('vendor_id', userId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          vendors(*),
          customers(*),
          delivery_boys(*),
          customer_addresses(*),
          order_items(*, products(*)),
          order_tracking(*)
        `)
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderData: {
      vendor_id: string;
      delivery_address_id: string;
      items: any[];
      payment_method: string;
      subtotal: number;
      delivery_fee: number;
      tax: number;
      total_amount: number;
      coupon_id?: string;
      coupon_discount?: number;
      special_instructions?: string;
    }) => {
      // Generate order number
      const orderNumber = `ORD${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: session?.user?.id,
          vendor_id: orderData.vendor_id,
          delivery_address_id: orderData.delivery_address_id,
          order_number: orderNumber,
          subtotal: orderData.subtotal,
          delivery_fee: orderData.delivery_fee,
          tax: orderData.tax,
          coupon_id: orderData.coupon_id,
          coupon_discount: orderData.coupon_discount || 0,
          total_amount: orderData.total_amount,
          payment_method: orderData.payment_method,
          special_instructions: orderData.special_instructions,
          item_count: orderData.items.length,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        product_image: item.image,
        product_sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.price,
        discount_price: item.discount_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Add tracking entry
      await supabase.from('order_tracking').insert({
        order_id: order.id,
        status: 'pending',
        description: 'Order placed successfully',
      });

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.byCustomer(session?.user?.id!) 
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      description 
    }: { 
      orderId: string; 
      status: string; 
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Add tracking entry
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status,
        description: description || `Order ${status}`,
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      reason 
    }: { 
      orderId: string; 
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: 'customer',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: 'cancelled',
        description: `Order cancelled by customer. Reason: ${reason}`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.byCustomer(session?.user?.id!) 
      });
    },
  });
}

// ==========================================
// ADDRESS HOOKS
// ==========================================

export function useAddresses() {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.addresses.all(customerId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useDefaultAddress() {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.addresses.default(customerId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_default', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (addressData: any) => {
      // If this is set as default, unset other defaults first
      if (addressData.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', session?.user?.id);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
          ...addressData,
          customer_id: session?.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.addresses.all(session?.user?.id!) 
      });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ addressId, updates }: { addressId: string; updates: any }) => {
      if (updates.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', session?.user?.id);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .update(updates)
        .eq('id', addressId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.addresses.all(session?.user?.id!) 
      });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.addresses.all(session?.user?.id!) 
      });
    },
  });
}

// ==========================================
// COUPON & OFFER HOOKS
// ==========================================

export function useActiveCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons.active,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useValidateCoupon() {
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ 
      code, 
      orderAmount 
    }: { 
      code: string; 
      orderAmount: number;
    }) => {
      const now = new Date().toISOString();
      
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single();

      if (error) throw new Error('Invalid coupon code');

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        throw new Error('Coupon usage limit reached');
      }

      // Check minimum order amount
      if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
        throw new Error(`Minimum order amount is ₹${coupon.min_order_amount}`);
      }

      // Check user usage limit
      const { count } = await supabase
        .from('coupon_usage')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('customer_id', session?.user?.id);

      if (count && count >= (coupon.usage_limit_per_user || 1)) {
        throw new Error('You have already used this coupon');
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (orderAmount * coupon.discount_value) / 100;
        if (coupon.max_discount_amount) {
          discount = Math.min(discount, coupon.max_discount_amount);
        }
      } else {
        discount = coupon.discount_value;
      }

      return { coupon, discount };
    },
  });
}

export function useActiveOffers() {
  return useQuery({
    queryKey: queryKeys.offers.active,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('display_order');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ==========================================
// REVIEW HOOKS
// ==========================================

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.byProduct(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customers(first_name, last_name, profile_image)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useVendorReviews(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.byVendor(vendorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customers(first_name, last_name, profile_image)')
        .eq('vendor_id', vendorId)
        .eq('review_type', 'vendor')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

export function useAddReview() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (reviewData: {
      order_id: string;
      vendor_id?: string;
      product_id?: string;
      delivery_boy_id?: string;
      rating: number;
      comment: string;
      review_type: 'vendor' | 'product' | 'delivery';
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          ...reviewData,
          customer_id: session?.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.product_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.reviews.byProduct(data.product_id) 
        });
      }
      if (data.vendor_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.reviews.byVendor(data.vendor_id) 
        });
      }
    },
  });
}

// ==========================================
// NOTIFICATION HOOKS
// ==========================================

export function useNotifications() {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.notifications.all(userId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

export function useUnreadNotificationCount() {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  return useQuery({
    queryKey: queryKeys.notifications.count(userId!),
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications.all(session?.user?.id!) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications.count(session?.user?.id!) 
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session?.user?.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications.all(session?.user?.id!) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications.count(session?.user?.id!) 
      });
    },
  });
}