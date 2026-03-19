// hooks/queries/orders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/authStore';
import { Coupon } from '@/types/offers.types';
import { Order, OrderFilters, OrderStatus, PaymentStatus } from '@/types/orders-carts.types';

// ==========================================
// QUERY KEYS
// ==========================================

export const orderQueryKeys = {
  orders: {
    all:        ['orders'] as const,
    lists:      () => [...orderQueryKeys.orders.all, 'list'] as const,
    list:       (filters?: OrderFilters) => [...orderQueryKeys.orders.lists(), filters] as const,
    byCustomer: (customerId: string, filters?: OrderFilters) =>
      [...orderQueryKeys.orders.lists(), 'customer', customerId, filters] as const,
    byVendor:   (vendorId: string, filters?: OrderFilters) =>
      [...orderQueryKeys.orders.lists(), 'vendor', vendorId, filters] as const,
    details:    () => [...orderQueryKeys.orders.all, 'detail'] as const,
    detail:     (id: string) => [...orderQueryKeys.orders.details(), id] as const,
    timeline:   (id: string) => [...orderQueryKeys.orders.detail(id), 'timeline'] as const,
  },
  orderGroups: {
    all:        ['order-groups'] as const,
    lists:      () => [...orderQueryKeys.orderGroups.all, 'list'] as const,
    list:       (filters?: OrderFilters) => [...orderQueryKeys.orderGroups.lists(), filters] as const,
    byCustomer: (customerId: string) =>
      [...orderQueryKeys.orderGroups.lists(), 'customer', customerId] as const,
    details:    () => [...orderQueryKeys.orderGroups.all, 'detail'] as const,
    detail:     (id: string) => [...orderQueryKeys.orderGroups.details(), id] as const,
  },
} as const;

// ==========================================
// TYPES FOR ORDER CREATION
// ==========================================

export interface CreateOrderItem {
  product_id: string;
  qty:        number;
}

export interface CreateOrderPayload {
  vendor_id:            string;
  delivery_address_id:  string;
  order_number:         string;
  item_count:           number;
  subtotal:             number;
  tax:                  number;
  tax_percentage:       number;
  discount:             number;
  // ✅ Pre-calculated discounted fee from useDeliveryFees hook
  // First vendor = full fee, additional vendors = 50% off
  // SQL reads this directly — no recalculation
  delivery_fee:         number;
  // ✅ Kept for SQL sorting (distance ASC = closest vendor first)
  distance_km:          number;
  special_instructions: string;
  items:                CreateOrderItem[];
}

export interface CreateOrderGroupParams {
  orders:        CreateOrderPayload[];
  paymentMethod: string;
  subtotal:      number;
  tax:           number;
  discount:      number;
  couponCode:    string | null;
}

// ==========================================
// MUTATION: Create Order Group
// ==========================================

export function useCreateOrderGroup() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      orders,
      paymentMethod,
      subtotal,
      tax,
      discount,
      couponCode,
    }: CreateOrderGroupParams): Promise<string> => {
      const customerId = session?.user?.id;
      if (!customerId) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc(
        'create_order_group_with_orders',
        {
          p_customer_id:    customerId,
          p_orders:         JSON.stringify(orders),
          p_payment_method: paymentMethod,
          p_subtotal:       subtotal,
          p_tax:            tax,
          p_discount:       discount,
          p_coupon_code:    couponCode ?? '',
        }
      );

      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orderGroups.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// ==========================================
// QUERY: Customer Order Groups (list)
// ==========================================

export function useCustomerOrderGroups(filters?: { paymentStatus?: PaymentStatus }) {
  const session    = useAuthStore((state) => state.session);
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
          delivery_otp,
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
    enabled:   !!customerId,
    staleTime: 1000 * 30,
  });
}

// ==========================================
// QUERY: Order Group Full Info (admin/vendor)
// ==========================================

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

// ==========================================
// QUERY: Orders by Group
// ==========================================

export function useOrdersByGroup(groupId: string, filters?: OrderFilters) {
  const session    = useAuthStore((state) => state.session);
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
      if (filters?.endDate)   query = query.lte('created_at', filters.endDate);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled:   !!customerId && !!groupId,
    staleTime: 1000 * 30,
  });
}

// ==========================================
// QUERY: Customer Orders
// ==========================================

export function useCustomerOrders(filters?: OrderFilters) {
  const session    = useAuthStore((state) => state.session);
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
      if (filters?.endDate)   query = query.lte('created_at', filters.endDate);

      if (filters?.search) {
        query = query.or(
          `order_number.ilike.%${filters.search}%,vendors.store_name.ilike.%${filters.search}%`
        );
      }

      if (filters?.limit)  query = query.limit(filters.limit);
      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 10) - 1
        );
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled:   !!customerId,
    staleTime: 1000 * 30,
  });
}

// ==========================================
// QUERY: Vendor Orders
// ==========================================

export function useVendorOrders(filters?: OrderFilters) {
  const session  = useAuthStore((state) => state.session);
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
          order_group_id,
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
      if (filters?.endDate)   query = query.lte('created_at', filters.endDate);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled:         !!vendorId,
    refetchInterval: 1000 * 30,
  });
}

// ==========================================
// QUERY: Order Detail
// ==========================================

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: orderQueryKeys.orders.detail(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_group_id,
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
    enabled:   !!orderId,
    staleTime: 0,
  });
}

// ==========================================
// QUERY: Order Group Detail (customer screen)
// ==========================================

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

// ==========================================
// QUERY: Order Timeline
// ==========================================

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
        status:    'Order Placed',
        completed: !!data.created_at,
        timestamp: data.created_at,
      });

      if (data.cancelled_at) {
        timeline.push({
          status:    'Cancelled',
          completed: true,
          timestamp: data.cancelled_at,
        });
        return timeline;
      }

      timeline.push({
        status:    'Confirmed',
        completed: !!data.vendor_accepted_at,
        timestamp: data.vendor_accepted_at,
      });

      timeline.push({
        status:    'Preparing Order',
        completed: !!data.vendor_accepted_at,
        timestamp: data.vendor_accepted_at,
      });

      timeline.push({
        status:    'Out for Delivery',
        completed: !!data.picked_up_at,
        timestamp: data.picked_up_at,
      });

      timeline.push({
        status:    'Delivered',
        completed: !!data.delivered_at,
        timestamp: data.delivered_at,
      });

      return timeline;
    },
    enabled: !!orderId,
  });
}

// ==========================================
// MUTATION: Cancel Order
// ==========================================

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const customerId = session?.user?.id;
      if (!customerId) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('customer_cancel_order', {
        p_order_id:            orderId,
        p_customer_id:         customerId,
        p_cancellation_reason: reason,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(variables.orderId) });
    },
  });
}

// ==========================================
// MUTATION: Vendor Cancel Order Item
// ==========================================

interface CancelOrderItemParams {
  orderId:     string;
  orderItemId: string;
  reason:      string;
}

interface CancelOrderItemResponse {
  success:                boolean;
  order_cancelled:        boolean;
  active_items_remaining?: number;
  new_subtotal?:          number;
  new_commission?:        number;
  new_vendor_payout?:     number;
}

export function useVendorCancelOrderItem() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation<CancelOrderItemResponse, Error, CancelOrderItemParams>({
    onMutate: async ({ orderId, orderItemId }) => {
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });

      const previousOrder = queryClient.getQueryData(orderQueryKeys.orders.detail(orderId));

      queryClient.setQueryData(orderQueryKeys.orders.detail(orderId), (old: any) => {
        if (!old) return old;

        const updatedItems = (old.order_items ?? []).map((item: any) =>
          item.id === orderItemId ? { ...item, status: 'cancelled' } : item
        );
        const activeItems    = updatedItems.filter((i: any) => i.status !== 'cancelled');
        const newSubtotal    = activeItems.reduce((s: number, i: any) => s + (i.total_price ?? 0), 0);
        const newCommission  = activeItems.reduce((s: number, i: any) => s + (i.commission_amount ?? 0), 0);
        const newItemCount   = activeItems.reduce((s: number, i: any) => s + (i.quantity ?? 0), 0);

        return {
          ...old,
          order_items:      updatedItems,
          subtotal:         newSubtotal,
          total_commission: newCommission,
          vendor_payout:    newSubtotal - newCommission,
          item_count:       newItemCount,
        };
      });

      return { previousOrder };
    },
    mutationFn: async ({ orderId, orderItemId, reason }) => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('vendor_cancel_order_item', {
        p_order_id:      orderId,
        p_order_item_id: orderItemId,
        p_vendor_id:     vendorId,
        p_reason:        reason,
      });

      if (error) throw error;

      const result = data as CancelOrderItemResponse;
      if (!result?.success) throw new Error((result as any)?.error ?? 'Failed to cancel item');
      return result;
    },
    onSuccess: (data, { orderId }) => {
      if (!data.order_cancelled) {
        queryClient.setQueryData(orderQueryKeys.orders.detail(orderId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            subtotal:         data.new_subtotal      ?? old.subtotal,
            total_commission: data.new_commission    ?? old.total_commission,
            vendor_payout:    data.new_vendor_payout ?? old.vendor_payout,
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
    },
    onError: (_error, { orderId }, context: any) => {
      if (context?.previousOrder) {
        queryClient.setQueryData(orderQueryKeys.orders.detail(orderId), context.previousOrder);
      }
    },
  });
}

// ==========================================
// MUTATION: Vendor Accept Order
// ==========================================

interface VendorAcceptOrderResponse {
  success:          boolean;
  order_id:         string;
  status:           string;
  vendor_payout:    number;
  total_commission: number;
  items_total:      number;
}

export function useVendorAcceptOrder() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string): Promise<VendorAcceptOrderResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('vendor_accept_order', {
        p_order_id:  orderId,
        p_vendor_id: vendorId,
      });

      if (error) throw error;
      return data as VendorAcceptOrderResponse;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
    },
  });
}

// ==========================================
// MUTATION: Vendor Reject Order
// ==========================================

interface VendorRejectOrderResponse {
  success:  boolean;
  order_id: string;
  status:   string;
  reason:   string;
}

export function useVendorRejectOrder() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason:  string;
    }): Promise<VendorRejectOrderResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      if (!reason?.trim()) throw new Error('Rejection reason is required');

      const { data, error } = await supabase.rpc('vendor_reject_order', {
        p_order_id:         orderId,
        p_vendor_id:        vendorId,
        p_rejection_reason: reason.trim(),
      });

      if (error) throw error;
      return data as VendorRejectOrderResponse;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
    },
  });
}

// ==========================================
// MUTATION: Mark Order Ready
// ==========================================

interface MarkOrderReadyResponse {
  success:     boolean;
  order_id:    string;
  ready_count: number;
  total_count: number;
  all_ready:   boolean;
  message:     string;
}

export function useMarkOrderReady() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string): Promise<MarkOrderReadyResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('mark_order_ready', {
        p_order_id:  orderId,
        p_vendor_id: vendorId,
      });

      if (error) throw error;

      const result = data as MarkOrderReadyResponse;
      if (!result?.success) {
        throw new Error((result as any)?.message ?? 'Failed to mark order as ready');
      }
      return result;
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });

      if (data.all_ready) {
        queryClient.invalidateQueries({ queryKey: ['delivery-groups', 'available'] });
      }
    },
  });
}

// ==========================================
// MUTATION: Assign Delivery Partner
// ==========================================

interface AssignDeliveryPartnerResponse {
  success:            boolean;
  order_id:           string;
  delivery_boy_id:    string;
  delivery_boy_name:  string;
}

export function useAssignDeliveryPartner() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      orderId,
      deliveryBoyId,
    }: {
      orderId:       string;
      deliveryBoyId: string;
    }): Promise<AssignDeliveryPartnerResponse> => {
      const vendorId = session?.user?.id;
      if (!vendorId) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('assign_delivery_partner', {
        p_order_id:        orderId,
        p_vendor_id:       vendorId,
        p_delivery_boy_id: deliveryBoyId,
      });

      if (error) throw error;
      return data as AssignDeliveryPartnerResponse;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
    },
  });
}

// ==========================================
// QUERY: Available Delivery Partners
// ==========================================

export function useAvailableDeliveryPartners(location?: {
  latitude:  number;
  longitude: number;
}) {
  return useQuery({
    queryKey: ['delivery-partners', 'available', location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select(`*, users(phone)`)
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

// ==========================================
// MUTATION: Update Order Status
// ==========================================

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId:      string;
      status:       OrderStatus;
      description?: string;
    }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };

      if (status === 'confirmed')  updates.confirmed_at  = new Date().toISOString();
      if (status === 'picked_up')  updates.picked_up_at  = new Date().toISOString();
      if (status === 'delivered')  updates.delivered_at  = new Date().toISOString();

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

// ==========================================
// MUTATION: Reorder
// ==========================================

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

// ==========================================
// MUTATION: Rate Order
// ==========================================

export function useRateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      rating,
      review,
    }: {
      orderId: string;
      rating:  number;
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
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.orders.detail(orderId) });
    },
  });
}

// ==========================================
// QUERY: Vendor Order Stats
// ==========================================

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
      return {
        total:    data.length,
        new:      data.filter((o) => ['pending', 'confirmed'].includes(o.status)).length,
        preparing: data.filter((o) => o.status === 'processing').length,
        ready:    data.filter((o) => o.status === 'ready_for_pickup').length,
        completed: data.filter((o) => o.status === 'delivered').length,
        cancelled: data.filter((o) => o.status === 'cancelled').length,
        todayRevenue: data
          .filter((o) => {
            const d = new Date(o.created_at);
            return (
              d.getDate()     === today.getDate()  &&
              d.getMonth()    === today.getMonth() &&
              d.getFullYear() === today.getFullYear()
            );
          })
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
      };
    },
    enabled: !!vendorId,
  });
}

// ==========================================
// COUPON HOOKS
// ==========================================

export const couponQueryKeys = {
  all:     ['coupons'] as const,
  active:  () => ['coupons', 'active'] as const,
  byCode:  (code: string) => ['coupons', 'code', code] as const,
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
      couponCode:  string;
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
      if (now > new Date(coupon.end_date))   throw new Error('Coupon has expired');

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
            : `You've reached the limit for this coupon (used ${used}/${perUserLimit} times)`
        );
      }

      const discountAmount = calculateCouponDiscount(coupon, orderAmount);
      return {
        coupon,
        discountAmount,
        finalAmount: Math.max(orderAmount - discountAmount, 0),
        usedCount,
        perUserLimit,
      };
    },
  });
}

export function useRecordCouponUsage() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({
      couponId,
      orderId,
      discountAmount,
    }: {
      couponId:       string;
      orderId:        string;
      discountAmount: number;
    }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id:       couponId,
          customer_id:     session.user.id,
          order_id:        orderId,
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
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, coupon.max_discount_amount);
    }
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
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (reviewData: {
      order_id:        string;
      vendor_id?:      string;
      product_id?:     string;
      delivery_boy_id?: string;
      rating:          number;
      comment:         string;
      review_type:     'vendor' | 'product' | 'delivery';
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
  const userId  = session?.user?.id;

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
    enabled:         !!userId,
    refetchInterval: 1000 * 60,
  });
}

export function useUnreadNotificationCount() {
  const session = useAuthStore((state) => state.session);
  const userId  = session?.user?.id;

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
    enabled:         !!userId,
    refetchInterval: 1000 * 30,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

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
  const session     = useAuthStore((state) => state.session);

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