// hooks/queries/orders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/authStore';
import { Coupon, CouponUsage } from '@/types/offers.types';
import { Order, OrderFilters, OrderStatus } from '@/types/orders-carts.types';

// ==========================================
// ORDER HOOKS
// ==========================================


export const orderQueryKeys = {
  orders: {
    all: ['orders'] as const,
    lists: () => [...orderQueryKeys.orders.all, 'list'] as const,
    list: (filters?: OrderFilters) => [...orderQueryKeys.orders.lists(), filters] as const,
    byCustomer: (customerId: string, filters?: OrderFilters) => 
      [...orderQueryKeys.orders.lists(), 'customer', customerId, filters] as const,
    byVendor: (vendorId: string, filters?: OrderFilters) => 
      [...orderQueryKeys.orders.lists(), 'vendor', vendorId, filters] as const,
    details: () => [...orderQueryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...orderQueryKeys.orders.details(), id] as const,
    timeline: (id: string) => [...orderQueryKeys.orders.detail(id), 'timeline'] as const,
  },
  orderGroups: {
    all: ['order-groups'] as const,
    lists: () => [...orderQueryKeys.orderGroups.all, 'list'] as const,
    list: (filters?: OrderFilters) => [...orderQueryKeys.orderGroups.lists(), filters] as const,
    byCustomer: (customerId: string) => 
      [...orderQueryKeys.orderGroups.lists(), 'customer', customerId] as const,
    details: () => [...orderQueryKeys.orderGroups.all, 'detail'] as const,
    detail: (id: string) => [...orderQueryKeys.orderGroups.details(), id] as const,
  },
} as const;

// ============================================================================
// QUERY: Get Customer Orders
// ============================================================================
export function useCustomerOrders(filters?: OrderFilters) {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: orderQueryKeys.orders.byCustomer(customerId!, filters),
    queryFn: async () => {
      if (!customerId) throw new Error('User not authenticated');

      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          payment_method,
          item_count,
          subtotal,
          delivery_fee,
          tax,
          tax_percentage,
          discount,
          coupon_discount,
          total_amount,
          special_instructions,
          cancellation_reason,
          cancelled_by,
          created_at,
          updated_at,
          confirmed_at,
          picked_up_at,
          delivered_at,
          cancelled_at,
          vendors!inner(
            user_id,
            store_name,
            store_image,
            store_banner,
            rating,
            review_count
          ),
          customer_addresses!inner(
            id,
            label,
            address_line1,
            address_line2,
            city,
            state,
            pincode
          ),
          delivery_boys(
            user_id,
            first_name,
            last_name,
            profile_photo,
            rating
          ),
          order_items(
            id,
            product_id,
            product_name,
            product_image,
            quantity,
            unit_price,
            discount_price,
            total_price
          )
        `)
        .eq('customer_id', customerId);

      // Apply filters
      if (filters?.status) {
        if (filters.status === 'active') {
          query = query.not('status', 'in', '(delivered,cancelled,refunded)');
        } else if (filters.status === 'completed') {
          query = query.eq('status', 'delivered');
        } else if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,vendors.store_name.ilike.%${filters.search}%`);
      }

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ============================================================================
// QUERY: Get Vendor Orders
// ============================================================================
export function useVendorOrders(filters?: OrderFilters) {
  const session = useAuthStore((state) => state.session);
  const vendorId = session?.user?.id;

  return useQuery({
    queryKey: orderQueryKeys.orders.byVendor(vendorId!, filters),
    queryFn: async () => {
      if (!vendorId) throw new Error('User not authenticated');

      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          payment_method,
          item_count,
          subtotal,
          delivery_fee,
          tax,
          discount,
          coupon_discount,
          total_amount,
          special_instructions,
          vendor_accepted_at,
          vendor_rejected_at,
          created_at,
          confirmed_at,
          delivered_at,
          customers!inner(
            user_id,
            first_name,
            last_name,
            profile_image
          ),
          customer_addresses!inner(
            id,
            label,
            address_line1,
            city,
            state,
            pincode
          ),
          delivery_boys(
            user_id,
            first_name,
            last_name,
            profile_photo
          ),
          order_items(
            id,
            product_name,
            product_image,
            quantity,
            unit_price,
            total_price,
            commission_rate,
            commission_amount
          )
        `)
        .eq('vendor_id', vendorId);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
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
    enabled: !!vendorId,
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds for new orders
  });
}

// ============================================================================
// QUERY: Get Order Detail
// ============================================================================
export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.orders.detail(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          vendors!inner(
            user_id,
            store_name,
            store_description,
            store_image,
            store_banner,
            address,
            city,
            state,
            rating,
            review_count,
            business_hours
          ),
          customers!inner(
            user_id,
            first_name,
            last_name,
            profile_image
          ),
          delivery_boys(
            user_id,
            first_name,
            last_name,
            profile_photo,
            vehicle_type,
            vehicle_number,
            rating,
            review_count
          ),
          customer_addresses!inner(
            id,
            label,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          order_items(
            id,
            product_id,
            product_name,
            product_image,
            quantity,
            unit_price,
            discount_price,
            total_price,
            commission_rate,
            commission_amount
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

// ============================================================================
// QUERY: Get Order Timeline
// ============================================================================
export function useOrderTimeline(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.orders.timeline(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          status,
          created_at,
          confirmed_at,
          vendor_accepted_at,
          picked_up_at,
          delivered_at,
          cancelled_at
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      const timeline = [];

      // Step 1: Order Placed
      timeline.push({
        status: 'Order Placed',
        completed: !!data.created_at,
        timestamp: data.created_at,
      });

      // If cancelled, show and stop
      if (data.cancelled_at) {
        timeline.push({
          status: 'Cancelled',
          completed: true,
          timestamp: data.cancelled_at,
        });
        return timeline;
      }

      // Step 2: Order Confirmed (combine payment + vendor acceptance)
      // Show as "Confirmed" when EITHER confirmed_at OR vendor_accepted_at exists
      timeline.push({
        status: 'Confirmed',
        completed: !!data.confirmed_at || !!data.vendor_accepted_at,
        timestamp: data.confirmed_at || data.vendor_accepted_at,
      });

      // Step 3: Preparing Order
      timeline.push({
        status: 'Preparing Order',
        completed: !!data.vendor_accepted_at,
        timestamp: data.vendor_accepted_at,
      });

      // Step 4: Out for Delivery
      timeline.push({
        status: 'Out for Delivery',
        completed: !!data.picked_up_at,
        timestamp: data.picked_up_at,
      });

      // Step 5: Delivered
      timeline.push({
        status: 'Delivered',
        completed: !!data.delivered_at,
        timestamp: data.delivered_at,
      });

      return timeline;
    },
    enabled: !!orderId,
  });
}

// ============================================================================
// QUERY: Get Order Group Detail
// ============================================================================
export function useOrderGroupDetail(orderGroupId: string) {
  return useQuery({
    queryKey: orderQueryKeys.orderGroups.detail(orderGroupId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_groups')
        .select(`
          *,
          customers!inner(
            user_id,
            first_name,
            last_name,
            profile_image
          ),
          orders(
            *,
            vendors!inner(
              user_id,
              store_name,
              store_image,
              rating
            ),
            order_items(
              id,
              product_name,
              product_image,
              quantity,
              unit_price,
              discount_price,
              total_price
            )
          )
        `)
        .eq('id', orderGroupId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderGroupId,
  });
}

// ============================================================================
// MUTATION: Cancel Order (Customer)
// ============================================================================
export function useCancelOrder() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason: string;
    }) => {
      const customerId = session?.user?.id;
      if (!customerId) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('customer_cancel_order', {
        p_order_id: orderId,
        p_customer_id: customerId,
        p_cancellation_reason: reason,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: orderQueryKeys.orders.all 
      });
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.orders.detail(variables.orderId),
      });
    },
  });
}

// ============================================================================
// MUTATION: Vendor Accept Order
// ============================================================================
export function useVendorAcceptOrder() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string) => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('vendor_accept_order', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
      });

      if (error) throw error;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ 
        queryKey: orderQueryKeys.orders.all 
      });
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.orders.detail(orderId),
      });
    },
  });
}

// ============================================================================
// MUTATION: Vendor Reject Order
// ============================================================================
export function useVendorRejectOrder() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason: string;
    }) => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('vendor_reject_order', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
        p_rejection_reason: reason,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: orderQueryKeys.orders.all 
      });
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.orders.detail(variables.orderId),
      });
    },
  });
}

// ============================================================================
// MUTATION: Update Order Status (Vendor/Admin)
// ============================================================================
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      description,
    }: {
      orderId: string;
      status: OrderStatus;
      description?: string;
    }) => {
      // Update order status
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Add timestamp fields based on status
      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (status === 'picked_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: orderQueryKeys.orders.detail(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: orderQueryKeys.orders.all 
      });
    },
  });
}

// ============================================================================
// MUTATION: Reorder (Add order items back to cart)
// ============================================================================
export function useReorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Get order items
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (error) throw error;

      // Return items to be added to cart
      // (Your cart logic will handle the actual addition)
      return orderItems;
    },
    onSuccess: () => {
      // Invalidate cart queries if you have them
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// ============================================================================
// MUTATION: Rate Order (Customer)
// ============================================================================
export function useRateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      rating,
      review,
    }: {
      orderId: string;
      rating: number;
      review?: string;
    }) => {
      // This would insert into a reviews table
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          rating,
          review,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.orders.detail(variables.orderId),
      });
    },
  });
}

// ==========================================
// COUPON & OFFER HOOKS
// ==========================================

// Query keys
export const couponQueryKeys = {
  all: ['coupons'] as const,
  active: () => ['coupons', 'active'] as const,
  byCode: (code: string) => ['coupons', 'code', code] as const,
  usage: (userId: string) => ['coupon-usage', userId] as const,
  userUsage: (userId: string, couponId: string) => ['coupon-usage', userId, couponId] as const,
};

// Fetch all active coupons
export function useActiveCoupons() {
  return useQuery({
    queryKey: couponQueryKeys.active(),
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('discount_value', { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });
}

// Fetch coupon by code
export function useCouponByCode(code: string) {
  return useQuery({
    queryKey: couponQueryKeys.byCode(code),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as Coupon;
    },
    enabled: !!code && code.length > 0,
  });
}

// Check user's coupon usage count for a specific coupon
export function useUserCouponUsage(couponId: string) {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: couponQueryKeys.userUsage(session?.user?.id!, couponId),
    queryFn: async () => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', couponId)
        .eq('customer_id', session.user.id);

      if (error) throw error;
      return data as CouponUsage[];
    },
    enabled: !!session?.user?.id && !!couponId,
  });
}

// Validate coupon eligibility
export function useValidateCoupon() {
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      couponCode,
      orderAmount,
      cartItems,
    }: {
      couponCode: string;
      orderAmount: number;
      cartItems?: any[];
    }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      // Fetch coupon
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        throw new Error('Invalid coupon code');
      }

      // Check date validity
      const now = new Date();
      const startDate = new Date(coupon.start_date);
      const endDate = new Date(coupon.end_date);

      if (now < startDate) {
        throw new Error('Coupon not yet valid');
      }

      if (now > endDate) {
        throw new Error('Coupon has expired');
      }

      // Check minimum order amount
      if (orderAmount < coupon.min_order_amount) {
        throw new Error(`Minimum order amount of ₹${coupon.min_order_amount} required`);
      }

      // Check total usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        throw new Error('Coupon usage limit reached');
      }

      // Check user usage limit
      const { data: userUsages, error: usageError } = await supabase
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', coupon.id)
        .eq('customer_id', session.user.id);

      if (usageError) throw usageError;

      if (userUsages && userUsages.length >= coupon.usage_limit_per_user) {
        throw new Error('You have already used this coupon maximum times');
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderAmount * coupon.discount_value) / 100;
        if (coupon.max_discount_amount) {
          discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
        }
      } else if (coupon.discount_type === 'fixed_amount') {
        discountAmount = coupon.discount_value;
      }

      return {
        coupon,
        discountAmount,
        finalAmount: Math.max(orderAmount - discountAmount, 0),
      };
    },
  });
}

// Record coupon usage (call this when order is placed)
export function useRecordCouponUsage() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      couponId,
      orderId,
    }: {
      couponId: string;
      orderId?: string;
    }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      // Record usage
      const { data: usage, error: usageError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          customer_id: session.user.id,
          order_id: orderId,
        })
        .select()
        .single();

      if (usageError) throw usageError;

      // Increment usage count
      const { error: updateError } = await supabase.rpc('increment_coupon_usage', {
        coupon_id: couponId,
      });

      if (updateError) throw updateError;

      return usage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.active() });
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.usage(session?.user?.id!) });
    },
  });
}

// Calculate discount helper
export function calculateCouponDiscount(
  coupon: Coupon,
  orderAmount: number
): number {
  if (orderAmount < coupon.min_order_amount) {
    return 0;
  }

  let discount = 0;
  
  if (coupon.discount_type === 'percentage') {
    discount = (orderAmount * coupon.discount_value) / 100;
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, coupon.max_discount_amount);
    }
  } else if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  }

  return discount;
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