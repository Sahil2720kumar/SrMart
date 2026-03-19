// hooks/queries/orders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/authStore';
import { Coupon, CouponUsage } from '@/types/offers.types';
import { Order, OrderFilters, OrderStatus, PaymentStatus } from '@/types/orders-carts.types';

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


export function useCustomerOrderGroups(filters?: { paymentStatus?: PaymentStatus }) {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: [...orderQueryKeys.orderGroups.byCustomer(customerId!), filters],
    queryFn: async () => {
      if (!customerId) throw new Error('User not authenticated');

      let query = supabase
        .from('order_groups')
        .select(`
          id,
          customer_id,
          razorpay_order_id,
          razorpay_payment_id,
          payment_method,
          payment_status,
          status,
          total_amount,
          created_at,
          updated_at,
          customers!inner(
            user_id,
            first_name,
            last_name,
            profile_image
          ),
          orders(
            id,
            order_number,
            status,
            total_amount,
            item_count,
            vendors(
              user_id,
              store_name,
              store_image,
              rating
            )
          )
        `)
        .eq('customer_id', customerId);

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

export function useOrderGroupDetailFullInfo(orderGroupId: string) {
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
            profile_image,
            email,
            phone
          ),
          orders(
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
            created_at,
            vendors!inner(
              user_id,
              store_name,
              store_image,
              store_banner,
              rating,
              review_count
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
              status
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

export function useOrdersByGroup(groupId: string, filters?: OrderFilters) {
  const session = useAuthStore((state) => state.session);
  const customerId = session?.user?.id;

  return useQuery({
    queryKey: [...orderQueryKeys.orders.lists(), 'group', groupId, filters],
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
            total_price,
            status
          )
        `)
        .eq('order_group_id', groupId)
        .eq('customer_id', customerId);

      if (filters?.status) {
        if (filters.status === 'active') {
          query = query.not('status', 'in', '(delivered,cancelled,refunded)');
        } else if (filters.status === 'completed') {
          query = query.eq('status', 'delivered');
        } else if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.startDate) query = query.gte('created_at', filters.startDate);
      if (filters?.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!customerId && !!groupId,
    staleTime: 1000 * 30,
  });
}

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
            total_price,
            status
          )
        `)
        .eq('customer_id', customerId);

      if (filters?.status) {
        if (filters.status === 'active') {
          query = query.not('status', 'in', '(delivered,cancelled,refunded)');
        } else if (filters.status === 'completed') {
          query = query.eq('status', 'delivered');
        } else if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.startDate) query = query.gte('created_at', filters.startDate);
      if (filters?.endDate) query = query.lte('created_at', filters.endDate);

      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,vendors.store_name.ilike.%${filters.search}%`);
      }

      if (filters?.limit) query = query.limit(filters.limit);
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

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
          total_commission,
          vendor_payout,
          special_instructions,
          vendor_accepted_at,
          cancelled_at,
          created_at,
          cancelled_by,
          cancellation_reason,
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
            discount_price,
            total_price,
            commission_rate,
            commission_amount,
            status
          )
        `)
        .eq('vendor_id', vendorId);

      if (filters?.startDate) query = query.gte('created_at', filters.startDate);
      if (filters?.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
    refetchInterval: 1000 * 30,
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
          vendors(
            user_id,
            store_name,
            store_description,
            store_image,
            store_banner,
            address,
            city,
            state,
            latitude,
            longitude,
            rating,
            review_count,
            business_hours
          ),
          customers(
            user_id,
            first_name,
            last_name,
            profile_image,
            users(phone)
          ),
          delivery_boys(
            user_id,
            users(phone),
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
            product_sku,
            quantity,
            unit,
            unit_price,
            discount_price,
            total_price,
            commission_rate,
            commission_amount,
            vendor_id,
            status
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
    staleTime: 0,
  });
}

// ============================================================================
// MUTATION: Cancel a single order item (vendor)
//
// Strategy — two-phase update for instant UI response:
//
// 1. OPTIMISTIC UPDATE (onMutate)
//    — Immediately mark the item as 'cancelled' in the cache
//    — Immediately update subtotal / total_commission / vendor_payout
//      on the order using values returned from the previous successful RPC,
//      or by re-computing from the remaining active items in the cache.
//    — Snapshot the previous cache value so we can roll back on error.
//
// 2. RPC CALL
//    — Calls `vendor_cancel_order_item` which recalculates all totals in the
//      DB and returns { new_subtotal, new_commission, new_vendor_payout }.
//
// 3. ON SUCCESS — patch cache with exact DB values + schedule a background
//    refetch to sync any edge-cases (e.g. order auto-cancelled).
//
// 4. ON ERROR   — roll back to the snapshot captured in onMutate.
// ============================================================================

interface CancelOrderItemParams {
  orderId: string;
  orderItemId: string;
  reason: string;
}

interface CancelOrderItemResponse {
  success: boolean;
  order_cancelled: boolean;
  active_items_remaining?: number;
  new_subtotal?: number;
  new_commission?: number;
  new_vendor_payout?: number;
}

export function useVendorCancelOrderItem() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<CancelOrderItemResponse, Error, CancelOrderItemParams>({
    // ── 1. Optimistic update ───────────────────────────────────────────────
    onMutate: async ({ orderId, orderItemId }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: orderQueryKeys.orders.detail(orderId),
      });

      // Snapshot current cache value for rollback
      const previousOrder = queryClient.getQueryData(
        orderQueryKeys.orders.detail(orderId)
      );

      // Apply optimistic update
      queryClient.setQueryData(
        orderQueryKeys.orders.detail(orderId),
        (old: any) => {
          if (!old) return old;

          // Mark the cancelled item in place
          const updatedItems = (old.order_items ?? []).map((item: any) =>
            item.id === orderItemId ? { ...item, status: 'cancelled' } : item
          );

          // Re-compute totals from the remaining active items
          const activeItems = updatedItems.filter(
            (i: any) => i.status !== 'cancelled'
          );

          const newSubtotal = activeItems.reduce(
            (sum: number, i: any) => sum + (i.total_price ?? 0),
            0
          );
          const newCommission = activeItems.reduce(
            (sum: number, i: any) => sum + (i.commission_amount ?? 0),
            0
          );
          const newVendorPayout = newSubtotal - newCommission;
          const newItemCount = activeItems.reduce(
            (sum: number, i: any) => sum + (i.quantity ?? 0),
            0
          );

          return {
            ...old,
            order_items: updatedItems,
            subtotal: newSubtotal,
            total_commission: newCommission,
            vendor_payout: newVendorPayout,
            item_count: newItemCount,
          };
        }
      );

      // Return snapshot for potential rollback
      return { previousOrder };
    },

    // ── 2. RPC call ────────────────────────────────────────────────────────
    mutationFn: async ({ orderId, orderItemId, reason }) => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('vendor_cancel_order_item', {
        p_order_id: orderId,
        p_order_item_id: orderItemId,
        p_vendor_id: vendorId,
        p_reason: reason,
      });

      if (error) throw error;

      const result = data as CancelOrderItemResponse;
      if (!result?.success) {
        throw new Error((result as any)?.error ?? 'Failed to cancel item');
      }

      return result;
    },

    // ── 3. On success — patch cache with exact DB values ──────────────────
    onSuccess: (data, { orderId }) => {
      if (!data.order_cancelled) {
        // Patch the order-level financial fields with exact DB-confirmed values
        queryClient.setQueryData(
          orderQueryKeys.orders.detail(orderId),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              subtotal: data.new_subtotal ?? old.subtotal,
              total_commission: data.new_commission ?? old.total_commission,
              vendor_payout: data.new_vendor_payout ?? old.vendor_payout,
            };
          }
        );
      }

      // Background refetch to catch edge-cases (order auto-cancelled, etc.)
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.orders.detail(orderId),
      });

      // Also invalidate vendor order lists so the list view stays in sync
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.orders.all,
      });
    },

    // ── 4. On error — roll back to snapshot ───────────────────────────────
    onError: (_error, { orderId }, context: any) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(
          orderQueryKeys.orders.detail(orderId),
          context.previousOrder
        );
      }
    },
  });
}

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

      timeline.push({
        status: 'Order Placed',
        completed: !!data.created_at,
        timestamp: data.created_at,
      });

      if (data.cancelled_at) {
        timeline.push({
          status: 'Cancelled',
          completed: true,
          timestamp: data.cancelled_at,
        });
        return timeline;
      }

      timeline.push({
        status: 'Confirmed',
        completed: !!data.vendor_accepted_at,
        timestamp: data.vendor_accepted_at,
      });

      timeline.push({
        status: 'Preparing Order',
        completed: !!data.vendor_accepted_at,
        timestamp: data.vendor_accepted_at,
      });

      timeline.push({
        status: 'Out for Delivery',
        completed: !!data.picked_up_at,
        timestamp: data.picked_up_at,
      });

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
              total_price,
              status
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
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({
        queryKey: orderQueryKeys.orders.detail(variables.orderId),
      });
    },
  });
}

// ============================================================================
// Response Types for RPC Functions
// ============================================================================

interface VendorAcceptOrderResponse {
  success: boolean;
  order_id: string;
  status: string;
  vendor_payout: number;
  total_commission: number;
  items_total: number;
}

interface VendorRejectOrderResponse {
  success: boolean;
  order_id: string;
  status: string;
  reason: string;
}

interface MarkOrderReadyResponse {
  success: boolean;
  order_id: string;
  status: string;
}

interface AssignDeliveryPartnerResponse {
  success: boolean;
  order_id: string;
  delivery_boy_id: string;
  delivery_boy_name: string;
}

export function useVendorAcceptOrder() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string): Promise<VendorAcceptOrderResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('vendor_accept_order', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
      });

      if (error) throw error;
      return data as VendorAcceptOrderResponse;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
    },
    onError: (error: any) => {
      console.error('Failed to accept order:', error.message);
    },
  });
}

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
    }): Promise<VendorRejectOrderResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      const { data, error } = await supabase.rpc('vendor_reject_order', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
        p_rejection_reason: reason.trim(),
      });

      if (error) throw error;
      return data as VendorRejectOrderResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(variables.orderId) });
    },
    onError: (error: any) => {
      console.error('Failed to reject order:', error.message);
    },
  });
}

export function useMarkOrderReady() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string): Promise<MarkOrderReadyResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('mark_order_ready', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
      });

      if (error) throw error;
      return data as MarkOrderReadyResponse;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
    },
    onError: (error: any) => {
      console.error('Failed to mark order as ready:', error.message);
    },
  });
}

export function useAssignDeliveryPartner() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      orderId,
      deliveryBoyId,
    }: {
      orderId: string;
      deliveryBoyId: string;
    }): Promise<AssignDeliveryPartnerResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('assign_delivery_partner', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
        p_delivery_boy_id: deliveryBoyId,
      });

      if (error) throw error;
      return data as AssignDeliveryPartnerResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(variables.orderId) });
    },
    onError: (error: any) => {
      console.error('Failed to assign delivery partner:', error.message);
    },
  });
}

export function useAvailableDeliveryPartners(location?: {
  latitude: number;
  longitude: number;
}) {
  return useQuery({
    queryKey: ['delivery-partners', 'available', location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select(`*,users(phone)`)
        .eq('is_available', true)
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!location,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
      description?: string;
    }) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
      else if (status === 'picked_up') updates.picked_up_at = new Date().toISOString();
      else if (status === 'delivered') updates.delivered_at = new Date().toISOString();

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
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
    },
  });
}

export function useReorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('product_id, quantity, products(*)')
        .eq('order_id', orderId);

      if (error) throw error;
      return orderItems;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

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
      const { data, error } = await supabase
        .from('reviews')
        .insert({ order_id: orderId, rating, review })
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useVendorOrderStats(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-stats', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('vendor_id', vendorId);

      if (error) throw error;

      const today = new Date();
      const stats = {
        total: data.length,
        new: data.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
        preparing: data.filter((o) => o.status === 'processing').length,
        ready: data.filter((o) => o.status === 'ready_for_pickup').length,
        completed: data.filter((o) => o.status === 'delivered').length,
        cancelled: data.filter((o) => o.status === 'cancelled').length,
        todayRevenue: data
          .filter((o) => {
            const d = new Date(o.created_at);
            return (
              d.getDate() === today.getDate() &&
              d.getMonth() === today.getMonth() &&
              d.getFullYear() === today.getFullYear()
            );
          })
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      };

      return stats;
    },
    enabled: !!vendorId,
  });
}

// ==========================================
// COUPON HOOKS
// ==========================================

export const couponQueryKeys = {
  all: ['coupons'] as const,
  active: () => ['coupons', 'active'] as const,
  byCode: (code: string) => ['coupons', 'code', code] as const,
  myUsage: (userId: string) => ['coupon-usage', 'mine', userId] as const,
};

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

export function useMyAllCouponUsage() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: couponQueryKeys.myUsage(session?.user?.id ?? ''),
    queryFn: async () => {
      if (!session?.user?.id) return {} as Record<string, number>;

      const { data, error } = await supabase
        .from('coupon_usage')
        .select('coupon_id')
        .eq('customer_id', session.user.id);

      if (error) throw error;

      const usageMap: Record<string, number> = {};
      for (const row of data ?? []) {
        usageMap[row.coupon_id] = (usageMap[row.coupon_id] ?? 0) + 1;
      }
      return usageMap;
    },
    enabled: !!session?.user?.id,
  });
}

export function useValidateCoupon() {
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      couponCode,
      orderAmount,
    }: {
      couponCode: string;
      orderAmount: number;
    }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) throw new Error('Invalid coupon code');

      const now = new Date();
      if (now < new Date(coupon.start_date)) throw new Error('Coupon is not active yet');
      if (now > new Date(coupon.end_date)) throw new Error('Coupon has expired');

      if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
        throw new Error(`Minimum order of ₹${coupon.min_order_amount} required`);
      }

      if (coupon.usage_limit != null && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
        throw new Error('This coupon is no longer available');
      }

      const perUserLimit = coupon.usage_limit_per_user ?? 1;

      const { count: usedCount, error: usageError } = await supabase
        .from('coupon_usage')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('customer_id', session.user.id);

      if (usageError) throw usageError;

      const used = usedCount ?? 0;

      if (used >= perUserLimit) {
        throw new Error(
          perUserLimit === 1
            ? 'You have already used this coupon'
            : `You've reached the limit for this coupon (used ${used}/${perUserLimit} times)`,
        );
      }

      return {
        coupon,
        discountAmount: calculateCouponDiscount(coupon, orderAmount),
        finalAmount: Math.max(orderAmount - calculateCouponDiscount(coupon, orderAmount), 0),
        usedCount: used,
        perUserLimit,
      };
    },
  });
}

export function useRecordCouponUsage() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      couponId,
      orderId,
      discountAmount,
    }: {
      couponId: string;
      orderId: string;
      discountAmount: number;
    }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          customer_id: session.user.id,
          order_id: orderId,
          discount_amount: discountAmount,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.warn('[coupon] usage already recorded for order', orderId);
          return null;
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponQueryKeys.active() });
      queryClient.invalidateQueries({
        queryKey: couponQueryKeys.myUsage(session?.user?.id ?? ''),
      });
    },
  });
}

export function calculateCouponDiscount(coupon: Coupon, orderAmount: number): number {
  if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) return 0;

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = (orderAmount * coupon.discount_value) / 100;
    if (coupon.max_discount_amount) discount = Math.min(discount, coupon.max_discount_amount);
  } else if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  }

  return Math.max(discount, 0);
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
        .insert({ ...reviewData, customer_id: session?.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.product_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byProduct(data.product_id) });
      }
      if (data.vendor_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byVendor(data.vendor_id) });
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
    refetchInterval: 1000 * 60,
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
    refetchInterval: 1000 * 30,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(session?.user?.id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count(session?.user?.id!) });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(session?.user?.id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count(session?.user?.id!) });
    },
  });
}