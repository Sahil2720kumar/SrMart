// hooks/queries/useDeliveryOrders.ts - UPDATED WITH CORRECT DELIVERY PAYOUT
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
  const R = 6371; // Earth's radius in km
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

/**
 * Calculate delivery fee using RPC function if not already set
 */
async function getDeliveryFee(existingFee: string | null, distanceKm: number): Promise<number> {
  // If delivery fee already exists and is not zero, use it
  if (existingFee && parseFloat(existingFee) > 0) {
    return parseFloat(existingFee);
  }

  // Otherwise, calculate using RPC function
  try {
    const { data, error } = await supabase.rpc('calculate_delivery_fee', {
      p_distance_km: distanceKm,
    });

    if (error) {
      console.error('Error calculating delivery fee:', error);
      // Fallback calculation if RPC fails
      return Math.max(30, Math.min(60, 20 + distanceKm * 5));
    }

    return parseFloat(data || '30');
  } catch (err) {
    console.error('Exception calculating delivery fee:', err);
    // Fallback calculation
    return Math.max(30, Math.min(60, 20 + distanceKm * 5));
  }
}

/**
 * Calculate delivery boy payout (what they actually receive)
 * Delivery boy ALWAYS gets the full delivery_fee amount, regardless of who pays
 * - Free delivery: Delivery boy gets delivery_fee (platform pays)
 * - Regular delivery: Delivery boy gets delivery_fee_paid_by_customer
 */
function calculateDeliveryPayout(order: any): number {
  const deliveryFee = parseFloat(order.delivery_fee || '0');

  // Delivery boy always gets the delivery fee
  // For free delivery: platform pays this amount
  // For regular delivery: customer pays this amount
  return deliveryFee;
}

/**
 * Calculate platform net revenue
 * - Regular delivery: Platform gets full commission (customer pays delivery separately)
 * - Free delivery: Platform gets commission minus delivery_fee (platform absorbs delivery cost)
 */
function calculatePlatformRevenue(order: any): number {
  const commission = parseFloat(order.total_commission || '0');
  const deliveryFee = parseFloat(order.delivery_fee || '0');

  // If NOT free delivery, platform gets entire commission
  // (customer paid delivery fee separately to delivery boy)
  if (!order.is_free_delivery) {
    return commission;
  }

  // If free delivery, platform pays delivery fee from commission
  // This can be negative if delivery_fee > commission
  return commission - deliveryFee;
}

// ==========================================
// QUERY: Get Available Orders (Ready for Pickup) - UPDATED
// ==========================================

export function useAvailableDeliveryOrders() {
  return useQuery({
    queryKey: deliveryQueryKeys.orders.available(),
    queryFn: async (): Promise<DeliveryOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
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
          order_items(
            id,
            product_name,
            quantity,
            unit
          )
        `
        )
        .eq('status', 'ready_for_pickup')
        .is('delivery_boy_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Filter out orders with missing data
      const validOrders = data.filter((order) => {
        const hasCustomer = order.customers;
        const hasAddress = order.customer_addresses;
        const hasVendor = order.vendors;
        const hasItems = order.order_items && order.order_items.length > 0;
        const hasPhone = order.customers?.users?.phone;

        if (!hasCustomer) console.warn(`⚠️ Order ${order.order_number}: Missing customer`);
        if (!hasAddress) console.warn(`⚠️ Order ${order.order_number}: Missing address`);
        if (!hasVendor) console.warn(`⚠️ Order ${order.order_number}: Missing vendor`);
        if (!hasItems) console.warn(`⚠️ Order ${order.order_number}: Missing items`);
        if (!hasPhone) console.warn(`⚠️ Order ${order.order_number}: Missing phone`);

        return hasCustomer && hasAddress && hasVendor && hasItems && hasPhone;
      });

      // Transform to delivery order format with calculated delivery fee
      const deliveryOrders: DeliveryOrder[] = await Promise.all(
        validOrders.map(async (order) => {
          const customer = order.customers!;
          const address = order.customer_addresses!;
          const vendor = order.vendors!;
          const phone = customer.users?.phone || '';

          const distance = calculateDistance(
            vendor.latitude || 0,
            vendor.longitude || 0,
            address.latitude || 0,
            address.longitude || 0
          );

          // Calculate delivery fee using RPC if needed
          const deliveryFee = await getDeliveryFee(order.delivery_fee, distance);

          // Calculate payout (what delivery boy receives)
          const payout = calculateDeliveryPayout(order);

          // Calculate platform net revenue
          const platformRevenue = calculatePlatformRevenue(order);

          console.log('📊 Order payout:', {
            order_number: order.order_number,
            is_free_delivery: order.is_free_delivery,
            commission: order.total_commission,
            delivery_fee: deliveryFee,
            payout: payout,
            platform_revenue: platformRevenue,
          });

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            customer: {
              name: `${customer.first_name} ${customer.last_name}`,
              address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
              phone: phone,
              lat: address.latitude || undefined,
              lng: address.longitude || undefined,
            },
            vendors: [
              {
                id: vendor.user_id,
                name: vendor.store_name,
                address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
                lat: vendor.latitude ?? undefined, // ✅ ADD
                lng: vendor.longitude ?? undefined, // ✅ ADD
                items: order.order_items!.map((item) => ({
                  id: item.id,
                  name: item.product_name,
                  qty: `${item.quantity} ${item.unit || 'pc'}`,
                  collected: false,
                })),
                collected: false,
              },
            ],
            payout: payout, // What delivery boy receives
            distance: Math.round(distance * 10) / 10,
            totalItems: order.item_count,
            deliveryOtp: order.delivery_otp || '',
            created_at: order.created_at,
            pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            is_free_delivery: order.is_free_delivery,
            calculated_delivery_fee: deliveryFee, // For reference
            platform_revenue: platformRevenue, // Platform's net revenue
          };
        })
      );

      return deliveryOrders;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// ==========================================
// QUERY: Get Active Orders - UPDATED
// ==========================================

export function useActiveDeliveryOrders() {
  const session = useAuthStore((state) => state.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.orders.active(deliveryBoyId!),
    queryFn: async (): Promise<DeliveryOrder[]> => {
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
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
          order_items(
            id,
            product_name,
            quantity,
            unit
          )
        `
        )
        .eq('delivery_boy_id', deliveryBoyId)
        .in('status', ['ready_for_pickup', 'picked_up', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Filter out orders with missing data
      const validOrders = data.filter((order) => {
        const hasCustomer = order.customers;
        const hasAddress = order.customer_addresses;
        const hasVendor = order.vendors;
        const hasItems = order.order_items && order.order_items.length > 0;
        const hasPhone = order.customers?.users?.phone;

        return hasCustomer && hasAddress && hasVendor && hasItems && hasPhone;
      });

      // Transform to delivery order format
      const deliveryOrders: DeliveryOrder[] = await Promise.all(
        validOrders.map(async (order) => {
          const customer = order.customers!;
          const address = order.customer_addresses!;
          const vendor = order.vendors!;
          const phone = customer.users?.phone || '';

          const distance = calculateDistance(
            vendor.latitude || 0,
            vendor.longitude || 0,
            address.latitude || 0,
            address.longitude || 0
          );

          // Calculate delivery fee using RPC if needed
          const deliveryFee = await getDeliveryFee(order.delivery_fee, distance);

          // Calculate payout
          const payout = calculateDeliveryPayout(order);

          // Calculate platform net revenue
          const platformRevenue = calculatePlatformRevenue(order);

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            customer: {
              name: `${customer.first_name} ${customer.last_name}`,
              address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
              phone: phone,
              lat: address.latitude || undefined,
              lng: address.longitude || undefined,
            },
            vendors: [
              {
                id: vendor.user_id,
                name: vendor.store_name,
                address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
                lat: vendor.latitude ?? undefined, // ✅ ADD
                lng: vendor.longitude ?? undefined, // ✅ ADD
                items: order.order_items!.map((item) => ({
                  id: item.id,
                  name: item.product_name,
                  qty: `${item.quantity} ${item.unit || 'pc'}`,
                  collected: !!order.picked_up_at,
                })),
                collected: !!order.picked_up_at,
              },
            ],
            payout: payout,
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
// QUERY: Get Completed Orders - UPDATED
// ==========================================

export function useCompletedDeliveryOrders() {
  const session = useAuthStore((state) => state.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.orders.completed(deliveryBoyId!),
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
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
          order_items(
            id,
            product_name,
            quantity,
            unit
          )
        `
        )
        .eq('delivery_boy_id', deliveryBoyId)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Completed orders fetch error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Filter and transform
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
          const address = order.customer_addresses!;
          const vendor = order.vendors!;
          const phone = customer.users?.phone || '';

          const distance = calculateDistance(
            vendor.latitude || 0,
            vendor.longitude || 0,
            address.latitude || 0,
            address.longitude || 0
          );

          const deliveryFee = await getDeliveryFee(order.delivery_fee, distance);
          const payout = calculateDeliveryPayout(order);
          const platformRevenue = calculatePlatformRevenue(order);

          return {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            customer: {
              name: `${customer.first_name} ${customer.last_name}`,
              address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
              phone: phone,
              lat: address.latitude || undefined,
              lng: address.longitude || undefined,
            },
            vendors: [
              {
                id: vendor.user_id,
                name: vendor.store_name,
                address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
                lat: vendor.latitude ?? undefined, // ✅ ADD
                lng: vendor.longitude ?? undefined, // ✅ ADD
                items: order.order_items!.map((item) => ({
                  id: item.id,
                  name: item.product_name,
                  qty: `${item.quantity} ${item.unit || 'pc'}`,
                  collected: true,
                })),
                collected: true,
              },
            ],
            payout: payout,
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
// QUERY: Get Order Detail - UPDATED
// ==========================================

export function useDeliveryOrderDetail(orderId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.orders.detail(orderId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
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
          order_items(
            id,
            product_name,
            quantity,
            unit
          )
        `
        )
        .eq('id', orderId)
        .single();

      if (error) throw error;

      const customer = data.customers!;
      const address = data.customer_addresses!;
      const vendor = data.vendors!;
      const phone = customer.users?.phone || '';

      const distance = calculateDistance(
        vendor.latitude || 0,
        vendor.longitude || 0,
        address.latitude || 0,
        address.longitude || 0
      );

      const deliveryFee = await getDeliveryFee(data.delivery_fee, distance);
      const payout = calculateDeliveryPayout(data);
      const platformRevenue = calculatePlatformRevenue(data);

      const deliveryOrder: DeliveryOrder = {
        id: data.id,
        order_number: data.order_number,
        status: data.status,
        delivery_boy_id:data.delivery_boy_id,
        customer: {
          name: `${customer.first_name} ${customer.last_name}`,
          address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
          phone: phone,
          lat: address.latitude || undefined,
          lng: address.longitude || undefined,
        },
        vendors: [
          {
            id: vendor.user_id,
            name: vendor.store_name,
            address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            lat: vendor.latitude ?? undefined, // ✅ ADD
            lng: vendor.longitude ?? undefined, // ✅ ADD
            items: data.order_items!.map((item) => ({
              id: item.id,
              name: item.product_name,
              qty: `${item.quantity} ${item.unit || 'pc'}`,
              collected: !!data.picked_up_at,
            })),
            collected: !!data.picked_up_at,
          },
        ],
        payout: payout,
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
  });
}

// ==========================================
// QUERY: Get Delivery Boy Stats - UPDATED
// ==========================================

export function useDeliveryBoyStats() {
  const session = useAuthStore((state) => state.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.stats(deliveryBoyId!),
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(
          'status, total_commission, delivery_fee, delivery_fee_paid_by_customer, is_free_delivery'
        )
        .eq('delivery_boy_id', deliveryBoyId);

      if (error) throw error;

      const totalOrders = data.length;
      const activeOrders = data.filter(
        (o) =>
          o.status === 'ready_for_pickup' ||
          o.status === 'picked_up' ||
          o.status === 'out_for_delivery'
      ).length;
      const completedOrders = data.filter((o) => o.status === 'delivered').length;

      // Calculate total earnings using the same logic as calculateDeliveryPayout
      // Delivery boy always gets the full delivery_fee
      const { data:wallet, error:walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', deliveryBoyId)
        .single();
 
      // Calculate distance from completed orders
      const { data: completedData, error: distanceError } = await supabase
        .from('orders')
        .select(
          `
          customer_addresses(latitude, longitude),
          vendors(latitude, longitude)
        `
        )
        .eq('delivery_boy_id', deliveryBoyId)
        .eq('status', 'delivered');

      let totalDistance = 0;
      if (!distanceError && completedData) {
        totalDistance = completedData.reduce((sum, order) => {
          const vendorLat = order.vendors?.latitude || 0;
          const vendorLng = order.vendors?.longitude || 0;
          const customerLat = order.customer_addresses?.latitude || 0;
          const customerLng = order.customer_addresses?.longitude || 0;
          return sum + calculateDistance(vendorLat, vendorLng, customerLat, customerLng);
        }, 0);
      }

      return {
        totalOrders,
        activeOrders,
        completedOrders,
        totalEarnings: wallet.lifetime_earnings,
        totalDistance: Math.round(totalDistance * 10) / 10,
      };
    },
    enabled: !!deliveryBoyId,
  });
}

// ==========================================
// MUTATION: Accept Order - NO CHANGES NEEDED
// ==========================================

export function useAcceptDeliveryOrder() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .update({
          delivery_boy_id: deliveryBoyId,
          status: 'ready_for_pickup', // ✅ KEEP SAME
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
// MUTATION: Mark Order as Picked Up - NO CHANGES NEEDED
// ==========================================

export function useMarkOrderPickedUp() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (orderId: string) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'out_for_delivery', // ✅ MOVE HERE
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
    onSuccess: (_,orderId) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;

      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.active(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.orders.detail(orderId) });
    },
  });
}


// ==========================================
// MUTATION: Complete Delivery (Verify OTP) - UPDATED
// ==========================================

export function useCompleteDelivery() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ orderId, otp }: CompleteDeliveryParams) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      // First verify OTP and get order details
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

      // Calculate platform net revenue
      const commission = parseFloat(order.total_commission || '0');
      const deliveryFee = parseFloat(order.delivery_fee || '0');

      // If free delivery, platform pays delivery fee from commission
      // Platform revenue = commission - delivery_fee (can be negative)
      // If not free delivery, platform keeps entire commission
      // Platform revenue = commission
      const platformNetRevenue = order.is_free_delivery ? commission - deliveryFee : commission;

      // Update order status with platform_net_revenue
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

      queryClient.invalidateQueries({
        queryKey: deliveryQueryKeys.orders.active(deliveryBoyId),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryQueryKeys.orders.completed(deliveryBoyId),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryQueryKeys.orders.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryQueryKeys.stats(deliveryBoyId),
      });
    },
  });
}
