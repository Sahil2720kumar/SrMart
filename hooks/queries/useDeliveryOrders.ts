// hooks/queries/useDeliveryOrders.ts
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
    detail: (orderId: string) => 
      [...deliveryQueryKeys.orders.all, 'detail', orderId] as const,
  },
  stats: (deliveryBoyId: string) => ['delivery-stats', deliveryBoyId] as const,
} as const;

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
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          item_count,
          customers!inner(
            user_id,
            first_name,
            last_name,
            phone
          ),
          customer_addresses!inner(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors!inner(
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
        `)
        .eq('status', 'ready_for_pickup')
        .is('delivery_boy_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to delivery order format
      const deliveryOrders: DeliveryOrder[] = (data as DeliveryOrderWithRelations[]).map(order => {
        const customer = order.customers;
        const address = order.customer_addresses;
        const vendor = order.vendors;

        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          customer: {
            name: `${customer.first_name} ${customer.last_name}`,
            address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
            phone: customer.phone || '',
            lat: address.latitude || undefined,
            lng: address.longitude || undefined,
          },
          vendors: [{
            id: vendor.user_id,
            name: vendor.store_name,
            address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            items: order.order_items.map((item) => ({
              id: item.id,
              name: item.product_name,
              qty: `${item.quantity} ${item.unit || 'pc'}`,
              collected: false,
            })),
            collected: false,
          }],
          payout: parseFloat(order.delivery_fee_paid_by_customer || '0'),
          distance: calculateDistance(
            vendor.latitude || 0,
            vendor.longitude || 0,
            address.latitude || 0,
            address.longitude || 0
          ),
          totalItems: order.item_count,
          deliveryOtp: order.delivery_otp || '',
          created_at: order.created_at,
          pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
        };
      });

      return deliveryOrders;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// ==========================================
// QUERY: Get Active Orders (Assigned to delivery boy)
// ==========================================

export function useActiveDeliveryOrders() {
  const session = useAuthStore((state) => state.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.orders.active(deliveryBoyId!),
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          item_count,
          picked_up_at,
          customers!inner(
            user_id,
            first_name,
            last_name,
            phone
          ),
          customer_addresses!inner(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors!inner(
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
        `)
        .eq('delivery_boy_id', deliveryBoyId)
        .in('status', ['ready_for_pickup', 'picked_up', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to delivery order format
      const deliveryOrders: DeliveryOrder[] = data.map(order => {
        const customer = order.customers;
        const address = order.customer_addresses;
        const vendor = order.vendors;

        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          customer: {
            name: `${customer.first_name} ${customer.last_name}`,
            address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
            phone: customer.phone || '',
            lat: address.latitude || undefined,
            lng: address.longitude || undefined,
          },
          vendors: [{
            id: vendor.user_id,
            name: vendor.store_name,
            address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            items: order.order_items.map((item, idx) => ({
              id: item.id,
              name: item.product_name,
              qty: `${item.quantity} ${item.unit || 'pc'}`,
              collected: !!order.picked_up_at, // Mark as collected if picked up
            })),
            collected: !!order.picked_up_at,
          }],
          payout: parseFloat(order.delivery_fee_paid_by_customer || '0'),
          distance: calculateDistance(
            vendor.latitude || 0,
            vendor.longitude || 0,
            address.latitude || 0,
            address.longitude || 0
          ),
          totalItems: order.item_count,
          deliveryOtp: order.delivery_otp || '',
          created_at: order.created_at,
          pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
        };
      });

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
  const session = useAuthStore((state) => state.session);
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
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          delivered_at,
          item_count,
          customers!inner(
            user_id,
            first_name,
            last_name,
            phone
          ),
          customer_addresses!inner(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors!inner(
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
        `)
        .eq('delivery_boy_id', deliveryBoyId)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform to delivery order format
      const deliveryOrders: DeliveryOrder[] = data.map(order => {
        const customer = order.customers;
        const address = order.customer_addresses;
        const vendor = order.vendors;

        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          customer: {
            name: `${customer.first_name} ${customer.last_name}`,
            address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
            phone: customer.phone || '',
            lat: address.latitude || undefined,
            lng: address.longitude || undefined,
          },
          vendors: [{
            id: vendor.user_id,
            name: vendor.store_name,
            address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
            items: order.order_items.map((item, idx) => ({
              id: item.id,
              name: item.product_name,
              qty: `${item.quantity} ${item.unit || 'pc'}`,
              collected: true,
            })),
            collected: true,
          }],
          payout: parseFloat(order.delivery_fee_paid_by_customer || '0'),
          distance: calculateDistance(
            vendor.latitude || 0,
            vendor.longitude || 0,
            address.latitude || 0,
            address.longitude || 0
          ),
          totalItems: order.item_count,
          deliveryOtp: order.delivery_otp || '',
          created_at: order.created_at,
          pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
        };
      });

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
          status,
          total_amount,
          delivery_fee,
          delivery_fee_paid_by_customer,
          delivery_otp,
          created_at,
          picked_up_at,
          delivered_at,
          item_count,
          customers!inner(
            user_id,
            first_name,
            last_name,
            phone
          ),
          customer_addresses!inner(
            id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            latitude,
            longitude
          ),
          vendors!inner(
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
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      const customer = data.customers;
      const address = data.customer_addresses;
      const vendor = data.vendors;

      const deliveryOrder: DeliveryOrder = {
        id: data.id,
        order_number: data.order_number,
        status: data.status,
        customer: {
          name: `${customer.first_name} ${customer.last_name}`,
          address: `${address.address_line1}, ${address.address_line2 ? address.address_line2 + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}`,
          phone: customer.phone || '',
          lat: address.latitude || undefined,
          lng: address.longitude || undefined,
        },
        vendors: [{
          id: vendor.user_id,
          name: vendor.store_name,
          address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
          items: data.order_items.map((item, idx) => ({
            id: item.id,
            name: item.product_name,
            qty: `${item.quantity} ${item.unit || 'pc'}`,
            collected: !!data.picked_up_at,
          })),
          collected: !!data.picked_up_at,
        }],
        payout: parseFloat(data.delivery_fee_paid_by_customer || '0'),
        distance: calculateDistance(
          vendor.latitude || 0,
          vendor.longitude || 0,
          address.latitude || 0,
          address.longitude || 0
        ),
        totalItems: data.item_count,
        deliveryOtp: data.delivery_otp || '',
        created_at: data.created_at,
        pickup_address: `${vendor.address}, ${vendor.city}, ${vendor.state}`,
      };

      return deliveryOrder;
    },
    enabled: !!orderId,
  });
}

// ==========================================
// QUERY: Get Delivery Boy Stats
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
        .select('status, delivery_fee_paid_by_customer')
        .eq('delivery_boy_id', deliveryBoyId);

      if (error) throw error;

      const totalOrders = data.length;
      const activeOrders = data.filter(
        o => o.status === 'ready_for_pickup' || o.status === 'picked_up' || o.status === 'out_for_delivery'
      ).length;
      const completedOrders = data.filter(o => o.status === 'delivered').length;
      const totalEarnings = data
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.delivery_fee_paid_by_customer || '0'), 0);

      // Calculate distance from completed orders
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
        totalEarnings: Math.round(totalEarnings),
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
      
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.orders.available() 
      });
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.orders.active(deliveryBoyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.stats(deliveryBoyId) 
      });
    },
  });
}

// ==========================================
// MUTATION: Mark Order as Picked Up
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
          status: 'out_for_delivery' as OrderStatus,
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
    onSuccess: (data) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.orders.active(deliveryBoyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.orders.detail(data.id) 
      });
    },
  });
}

// ==========================================
// MUTATION: Complete Delivery (Verify OTP)
// ==========================================

export function useCompleteDelivery() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async ({ orderId, otp }: CompleteDeliveryParams) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Delivery boy not authenticated');

      // First verify OTP
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('delivery_otp')
        .eq('id', orderId)
        .eq('delivery_boy_id', deliveryBoyId)
        .single();

      if (fetchError) throw fetchError;

      if (order.delivery_otp !== otp) {
        throw new Error('Invalid OTP');
      }

      // Update order status
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'delivered' as OrderStatus,
          payment_status: 'completed',
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
        queryKey: deliveryQueryKeys.orders.active(deliveryBoyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.orders.completed(deliveryBoyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.orders.detail(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: deliveryQueryKeys.stats(deliveryBoyId) 
      });
    },
  });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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