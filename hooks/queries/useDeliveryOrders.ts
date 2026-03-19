// hooks/queries/useDeliveryOrders.ts - UPDATED WITH CANCELLED ITEMS SUPPORT
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { OrderStatus } from '@/types/orders-carts.types';
import type {
  DeliveryOrder,
  DeliveryOrderVendor,
  DeliveryOrderItem,
  DeliveryOrderWithRelations,
  DeliveryBoyStats,
  AcceptOrderParams,
  MarkOrderPickedUpParams,
  CompleteDeliveryParams,
} from '@/types/delivery-orders.types';

// ==========================================
// DELIVERY BOY QUERY KEYS
// ==========================================

export const deliveryQueryKeys = {
  orders: {
    all: ['delivery-orders'] as const,
    available: () => [...deliveryQueryKeys.orders.all, 'available'] as const,
    assigned: (deliveryBoyId: string) =>
      [...deliveryQueryKeys.orders.all, 'assigned', deliveryBoyId] as const,
    active: (deliveryBoyId: string) =>
      [...deliveryQueryKeys.orders.all, 'active', deliveryBoyId] as const,
    completed: (deliveryBoyId: string) =>
      [...deliveryQueryKeys.orders.all, 'completed', deliveryBoyId] as const,
    detail: (orderId: string) => [...deliveryQueryKeys.orders.all, 'detail', orderId] as const,
  },
  stats: (deliveryBoyId: string) => ['delivery-stats', deliveryBoyId] as const,
} as const;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getDeliveryFee(existingFee: string | null, distanceKm: number): Promise<number> {
  if (existingFee && parseFloat(existingFee) > 0) {
    return parseFloat(existingFee);
  }
  try {
    const { data, error } = await supabase.rpc('calculate_delivery_fee', {
      p_distance_km: distanceKm,
    });
    if (error) {
      console.error('Error calculating delivery fee:', error);
      return Math.max(30, Math.min(60, 20 + distanceKm * 5));
    }
    return parseFloat(data || '30');
  } catch (err) {
    console.error('Exception calculating delivery fee:', err);
    return Math.max(30, Math.min(60, 20 + distanceKm * 5));
  }
}

function calculateDeliveryPayout(order: any): number {
  return parseFloat(order.delivery_fee || '0');
}

function calculatePlatformRevenue(order: any): number {
  const commission = parseFloat(order.total_commission || '0');
  const deliveryFee = parseFloat(order.delivery_fee || '0');
  if (!order.is_free_delivery) return commission;
  return commission - deliveryFee;
}

// ── Shared order_items select fragment ───────────────────────────────────────
// status is included so cancelled items are visible to the delivery boy
const ORDER_ITEMS_SELECT = `
  id,
  product_name,
  quantity,
  unit,
  status
`;

// ── Helper: map a raw order_item row → DeliveryOrderItem ─────────────────────
function mapItem(item: any, pickedUpAt: string | null) {
  return {
    id: item.id,
    name: item.product_name,
    qty: `${item.quantity} ${item.unit || 'pc'}`,
    collected: item.status === 'cancelled' ? false : !!pickedUpAt,
    status: item.status ?? 'active',   // ✅ expose status to the UI
  };
}

// ==========================================
// QUERY: Get Available Orders (Ready for Pickup)
// ==========================================

export function useAvailableDeliveryOrders() {
  return useQuery({
    queryKey: deliveryQueryKeys.orders.available(),
    queryFn: async (): Promise<DeliveryOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          total_commission,
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          item_count,
          is_free_delivery,
          platform_net_revenue,
          customers(
            user_id,
            first_name,
            last_name,
            users!customers_user_id_fkey(phone)
          ),
          customer_addresses(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors(
            user_id,
            store_name,
            address,
            city,
            state,
            latitude,
            longitude
          ),
          order_items(${ORDER_ITEMS_SELECT})
        `)
        .eq('status', 'ready_for_pickup')
        .is('delivery_boy_id', null)
        .order('created_at', { ascending: false });

      if (error) { console.error('❌ Fetch error:', error); throw error; }
      if (!data || data.length === 0) return [];

      const validOrders = data.filter((order) => {
        const hasCustomer = order.customers;
        const hasAddress  = order.customer_addresses;
        const hasVendor   = order.vendors;
        // At least one active item required
        const hasItems    = order.order_items?.some((i: any) => i.status !== 'cancelled');
        const hasPhone    = order.customers?.users?.phone;

        if (!hasCustomer) console.warn(`⚠️ Order ${order.order_number}: Missing customer`);
        if (!hasAddress)  console.warn(`⚠️ Order ${order.order_number}: Missing address`);
        if (!hasVendor)   console.warn(`⚠️ Order ${order.order_number}: Missing vendor`);
        if (!hasItems)    console.warn(`⚠️ Order ${order.order_number}: No active items`);
        if (!hasPhone)    console.warn(`⚠️ Order ${order.order_number}: Missing phone`);

        return hasCustomer && hasAddress && hasVendor && hasItems && hasPhone;
      });

      const deliveryOrders: DeliveryOrder[] = await Promise.all(
        validOrders.map(async (order) => {
          const customer = order.customers!;
          const address  = order.customer_addresses!;
          const vendor   = order.vendors!;
          const phone    = customer.users?.phone || '';

          const distance = calculateDistance(
            vendor.latitude || 0, vendor.longitude || 0,
            address.latitude || 0, address.longitude || 0,
          );

          const deliveryFee     = await getDeliveryFee(order.delivery_fee, distance);
          const payout          = calculateDeliveryPayout(order);
          const platformRevenue = calculatePlatformRevenue(order);

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            customer: {
              name: `${customer.first_name} ${customer.last_name}`,
              address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
              phone,
              lat: address.latitude  || undefined,
              lng: address.longitude || undefined,
            },
            vendors: [
              {
                id: vendor.user_id,
                name: vendor.store_name,
                address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
                lat: vendor.latitude  ?? undefined,
                lng: vendor.longitude ?? undefined,
                items: order.order_items!.map((item: any) => mapItem(item, null)),
                collected: false,
              },
            ],
            payout,
            distance: Math.round(distance * 10) / 10,
            totalItems: order.item_count,
            deliveryOtp: order.delivery_otp || '',
            created_at: order.created_at,
            pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            is_free_delivery: order.is_free_delivery,
            calculated_delivery_fee: deliveryFee,
            platform_revenue: platformRevenue,
          };
        })
      );

      return deliveryOrders;
    },
    refetchInterval: 30000,
  });
}

// ==========================================
// QUERY: Get Active Orders
// ==========================================

export function useActiveDeliveryOrders() {
  const session       = useAuthStore((state) => state.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.orders.active(deliveryBoyId!),
    queryFn: async (): Promise<DeliveryOrder[]> => {
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          total_commission,
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          item_count,
          picked_up_at,
          is_free_delivery,
          platform_net_revenue,
          customers(
            user_id,
            first_name,
            last_name,
            users!customers_user_id_fkey(phone)
          ),
          customer_addresses(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors(
            user_id,
            store_name,
            address,
            city,
            state,
            latitude,
            longitude
          ),
          order_items(${ORDER_ITEMS_SELECT})
        `)
        .eq('delivery_boy_id', deliveryBoyId)
        .in('status', ['ready_for_pickup', 'picked_up', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) { console.error('❌ Fetch error:', error); throw error; }
      if (!data || data.length === 0) return [];

      const validOrders = data.filter(
        (order) =>
          order.customers &&
          order.customer_addresses &&
          order.vendors &&
          order.order_items?.some((i: any) => i.status !== 'cancelled') &&
          order.customers?.users?.phone
      );

      const deliveryOrders: DeliveryOrder[] = await Promise.all(
        validOrders.map(async (order) => {
          const customer = order.customers!;
          const address  = order.customer_addresses!;
          const vendor   = order.vendors!;
          const phone    = customer.users?.phone || '';

          const distance = calculateDistance(
            vendor.latitude || 0, vendor.longitude || 0,
            address.latitude || 0, address.longitude || 0,
          );

          const deliveryFee     = await getDeliveryFee(order.delivery_fee, distance);
          const payout          = calculateDeliveryPayout(order);
          const platformRevenue = calculatePlatformRevenue(order);

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            customer: {
              name: `${customer.first_name} ${customer.last_name}`,
              address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
              phone,
              lat: address.latitude  || undefined,
              lng: address.longitude || undefined,
            },
            vendors: [
              {
                id: vendor.user_id,
                name: vendor.store_name,
                address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
                lat: vendor.latitude  ?? undefined,
                lng: vendor.longitude ?? undefined,
                items: order.order_items!.map((item: any) => mapItem(item, order.picked_up_at)),
                collected: !!order.picked_up_at,
              },
            ],
            payout,
            distance: Math.round(distance * 10) / 10,
            totalItems: order.item_count,
            deliveryOtp: order.delivery_otp || '',
            created_at: order.created_at,
            pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            is_free_delivery: order.is_free_delivery,
            calculated_delivery_fee: deliveryFee,
            platform_revenue: platformRevenue,
          };
        })
      );

      return deliveryOrders;
    },
    enabled: !!deliveryBoyId,
    refetchInterval: 30000,
  });
}

// ==========================================
// QUERY: Get Completed Orders
// ==========================================

export function useCompletedDeliveryOrders() {
  const session       = useAuthStore((state) => state.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.orders.completed(deliveryBoyId!),
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          total_commission,
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          delivered_at,
          item_count,
          is_free_delivery,
          platform_net_revenue,
          customers(
            user_id,
            first_name,
            last_name,
            users!customers_user_id_fkey(phone)
          ),
          customer_addresses(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors(
            user_id,
            store_name,
            address,
            city,
            state,
            latitude,
            longitude
          ),
          order_items(${ORDER_ITEMS_SELECT})
        `)
        .eq('delivery_boy_id', deliveryBoyId)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) { console.error('❌ Completed orders fetch error:', error); throw error; }
      if (!data || data.length === 0) return [];

      const validOrders = data.filter(
        (order) =>
          order.customers &&
          order.customer_addresses &&
          order.vendors &&
          order.order_items?.length > 0 &&
          order.customers?.users?.phone
      );

      const deliveryOrders: DeliveryOrder[] = await Promise.all(
        validOrders.map(async (order) => {
          const customer = order.customers!;
          const address  = order.customer_addresses!;
          const vendor   = order.vendors!;
          const phone    = customer.users?.phone || '';

          const distance = calculateDistance(
            vendor.latitude || 0, vendor.longitude || 0,
            address.latitude || 0, address.longitude || 0,
          );

          const deliveryFee     = await getDeliveryFee(order.delivery_fee, distance);
          const payout          = calculateDeliveryPayout(order);
          const platformRevenue = calculatePlatformRevenue(order);

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            customer: {
              name: `${customer.first_name} ${customer.last_name}`,
              address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
              phone,
              lat: address.latitude  || undefined,
              lng: address.longitude || undefined,
            },
            vendors: [
              {
                id: vendor.user_id,
                name: vendor.store_name,
                address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
                lat: vendor.latitude  ?? undefined,
                lng: vendor.longitude ?? undefined,
                // For completed orders every active item was collected
                items: order.order_items!.map((item: any) => ({
                  ...mapItem(item, 'delivered'),
                  collected: item.status !== 'cancelled',
                })),
                collected: true,
              },
            ],
            payout,
            distance: Math.round(distance * 10) / 10,
            totalItems: order.item_count,
            deliveryOtp: order.delivery_otp || '',
            created_at: order.created_at,
            pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            is_free_delivery: order.is_free_delivery,
            calculated_delivery_fee: deliveryFee,
            platform_revenue: platformRevenue,
          };
        })
      );

      return deliveryOrders;
    },
    enabled: !!deliveryBoyId,
  });
}

// ==========================================
// QUERY: Get Order Detail
// ==========================================

export function useDeliveryOrderDetail(orderId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.orders.detail(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          delivery_boy_id,
          status,
          total_amount,
          total_commission,
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          picked_up_at,
          delivered_at,
          item_count,
          is_free_delivery,
          platform_net_revenue,
          customers(
            user_id,
            first_name,
            last_name,
            users!customers_user_id_fkey(phone)
          ),
          customer_addresses(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors(
            user_id,
            store_name,
            address,
            city,
            state,
            latitude,
            longitude
          ),
          order_items(${ORDER_ITEMS_SELECT})
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      const customer = data.customers!;
      const address  = data.customer_addresses!;
      const vendor   = data.vendors!;
      const phone    = customer.users?.phone || '';

      const distance = calculateDistance(
        vendor.latitude || 0, vendor.longitude || 0,
        address.latitude || 0, address.longitude || 0,
      );

      const deliveryFee     = await getDeliveryFee(data.delivery_fee, distance);
      const payout          = calculateDeliveryPayout(data);
      const platformRevenue = calculatePlatformRevenue(data);

      const deliveryOrder: DeliveryOrder = {
        id: data.id,
        order_number: data.order_number,
        status: data.status,
        delivery_boy_id: data.delivery_boy_id,
        customer: {
          name: `${customer.first_name} ${customer.last_name}`,
          address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
          phone,
          lat: address.latitude  || undefined,
          lng: address.longitude || undefined,
        },
        vendors: [
          {
            id: vendor.user_id,
            name: vendor.store_name,
            address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            lat: vendor.latitude  ?? undefined,
            lng: vendor.longitude ?? undefined,
            // ✅ status is now included so the UI can split active vs cancelled
            items: data.order_items!.map((item: any) => mapItem(item, data.picked_up_at)),
            collected: !!data.picked_up_at,
          },
        ],
        payout,
        distance: Math.round(distance * 10) / 10,
        totalItems: data.item_count,
        deliveryOtp: data.delivery_otp || '',
        created_at: data.created_at,
        pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
        is_free_delivery: data.is_free_delivery,
        calculated_delivery_fee: deliveryFee,
        platform_revenue: platformRevenue,
      };

      return deliveryOrder;
    },
    enabled: !!orderId,
    staleTime: 0,  // always re-fetch after item cancellation
  });
}

// ==========================================
// QUERY: Get Delivery Boy Stats
// ==========================================

export function useDeliveryBoyStats() {
  const session       = useAuthStore((state) => state.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.stats(deliveryBoyId!),
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select('status, total_commission, delivery_fee, delivery_fee_paid_by_customer, is_free_delivery')
        .eq('delivery_boy_id', deliveryBoyId);

      if (error) throw error;

      const totalOrders     = data.length;
      const activeOrders    = data.filter(
        (o) => ['ready_for_pickup', 'picked_up', 'out_for_delivery'].includes(o.status)
      ).length;
      const completedOrders = data.filter((o) => o.status === 'delivered').length;

      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', deliveryBoyId)
        .single();

      const { data: completedData, error: distanceError } = await supabase
        .from('orders')
        .select(`
          customer_addresses(latitude, longitude),
          vendors(latitude, longitude)
        `)
        .eq('delivery_boy_id', deliveryBoyId)
        .eq('status', 'delivered');

      let totalDistance = 0;
      if (!distanceError && completedData) {
        totalDistance = completedData.reduce((sum, order) => {
          const vendorLat    = order.vendors?.latitude || 0;
          const vendorLng    = order.vendors?.longitude || 0;
          const customerLat  = order.customer_addresses?.latitude || 0;
          const customerLng  = order.customer_addresses?.longitude || 0;
          return sum + calculateDistance(vendorLat, vendorLng, customerLat, customerLng);
        }, 0);
      }

      return {
        totalOrders,
        activeOrders,
        completedOrders,
        totalEarnings: wallet?.lifetime_earnings ?? 0,
        totalDistance: Math.round(totalDistance * 10) / 10,
      };
    },
    enabled: !!deliveryBoyId,
  });
}

// ==========================================
// MUTATION: Accept Order
// ==========================================

export function useAcceptDeliveryOrder() {
  const queryClient   = useQueryClient();
  const session       = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .update({
          delivery_boy_id: deliveryBoyId,
          status: 'ready_for_pickup',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'ready_for_pickup')
        .is('delivery_boy_id', null)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.available() });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.active(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.stats(deliveryBoyId) });
    },
  });
}

// ==========================================
// MUTATION: Mark Order as Picked Up
// ==========================================

export function useMarkOrderPickedUp() {
  const queryClient   = useQueryClient();
  const session       = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'out_for_delivery',
          picked_up_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('delivery_boy_id', deliveryBoyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, orderId) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.active(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.detail(orderId) });
    },
  });
}

// ==========================================
// MUTATION: Complete Delivery (Verify OTP)
// ==========================================

export function useCompleteDelivery() {
  const queryClient   = useQueryClient();
  const session       = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ orderId, otp }: CompleteDeliveryParams) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('delivery_otp, total_commission, delivery_fee, is_free_delivery')
        .eq('id', orderId)
        .eq('delivery_boy_id', deliveryBoyId)
        .single();

      if (fetchError) throw fetchError;

      if (order.delivery_otp !== otp) {
        throw new Error('Invalid OTP');
      }

      const commission       = parseFloat(order.total_commission || '0');
      const deliveryFee      = parseFloat(order.delivery_fee || '0');
      const platformNetRevenue = order.is_free_delivery
        ? commission - deliveryFee
        : commission;

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'delivered' as OrderStatus,
          payment_status: 'paid',
          platform_net_revenue: platformNetRevenue.toFixed(2),
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('delivery_boy_id', deliveryBoyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.active(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.completed(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.stats(deliveryBoyId) });
    },
  });
}