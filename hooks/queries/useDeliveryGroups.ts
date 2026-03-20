// hooks/queries/useDeliveryGroups.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const deliveryQueryKeys = {
  groups: {
    all:       ['delivery-groups'] as const,
    available: () => [...deliveryQueryKeys.groups.all, 'available'] as const,
    active:    (id: string) => [...deliveryQueryKeys.groups.all, 'active', id] as const,
    completed: (id: string) => [...deliveryQueryKeys.groups.all, 'completed', id] as const,
    detail:    (id: string) => [...deliveryQueryKeys.groups.all, 'detail', id] as const,
  },
  stats: (id: string) => ['delivery-stats', id] as const,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroupOrderItem {
  id:                string;
  product_id:        string;
  name:              string;
  product_image:     string | null;
  qty:               string;
  quantity:          number;
  unit_price:        number;
  discount_price:    number | null;
  effective_price:   number;
  total_price:       number;
  commission_rate:   number;
  commission_amount: number;
  status:            string;
}

export interface GroupVendorStop {
  order_id:             string;
  vendor_id:            string;
  vendor_name:          string;
  address:              string;
  latitude:             number | null;
  longitude:            number | null;
  stop_index:           number;
  status:               string;
  picked_up_at:         string | null;
  subtotal:             number;
  delivery_fee:         number;
  total_amount:         number;
  special_instructions: string | null;
  items:                GroupOrderItem[];
}

export interface DeliveryGroup {
  id:                string;
  status:            string;
  assignment_status: string | null;
  payment_method:    string;
  total_amount:      number;
  delivery_fee:      number;
  subtotal:          number;
  is_free_delivery:  boolean;
  created_at:        string;
  pickup_route:      any;
  payout:            number;
  totalItems:        number;
  otp:               string;
  distance:          number;
  cod_status:           string | null;
  cod_amount:           number | null;
  cod_deposit_deadline: string | null;
  cod_deposited_at:     string | null;
  cod_deposit_notes:    string | null;
  customer: {
    name:    string;
    phone:   string;
    address: string;
    lat:     number | null;
    lng:     number | null;
  };
  vendors: GroupVendorStop[];
  orders:  { id: string; status: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Select String ────────────────────────────────────────────────────────────

const ORDER_GROUP_SELECT = `
  id,
  customer_id,
  payment_method,
  payment_status,
  status,
  assignment_status,
  subtotal,
  delivery_fee,
  tax,
  discount,
  coupon_discount,
  total_amount,
  is_free_delivery,
  delivery_otp,
  pickup_route,
  assigned_at,
  broadcast_started_at,
  created_at,
  cod_status,
  cod_amount,
  cod_deposit_deadline,
  cod_deposited_at,
  cod_deposited_by,
  cod_deposit_notes,
  customers!inner(
    user_id,
    first_name,
    last_name,
    users(phone)
  ),
  orders!inner(
    id,
    status,
    vendor_id,
    delivery_otp,
    subtotal,
    delivery_fee,
    delivery_fee_paid_by_customer,
    total_amount,
    payment_method,
    special_instructions,
    picked_up_at,
    is_free_delivery,
    vendors!inner(
      user_id,
      store_name,
      store_image,
      address,
      city,
      latitude,
      longitude
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
      commission_amount,
      status
    )
  )
`;

const ORDER_GROUP_DETAIL_SELECT = ORDER_GROUP_SELECT;

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapGroupToDelivery(group: any): DeliveryGroup {
  const customer = group.customers;
  const phone    = customer?.users?.phone || '';
  const orders   = group.orders || [];

  const firstOrder   = orders.find((o: any) => o.status !== 'cancelled') || orders[0];
  const address      = firstOrder?.customer_addresses;
  const customerLat  = address?.latitude  ?? null;
  const customerLng  = address?.longitude ?? null;
  const customerAddr = address
    ? [
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.pincode,
      ].filter(Boolean).join(', ')
    : '';

  // ✅ Use pickup_route for distance + stop ordering
  // pickup_route is built by start_group_broadcast using real Haversine distances
  const pickupRoute: Array<{
    order_id:    string;
    vendor_id:   string;
    distance_km: number;
    stop_index:  number;
  }> = Array.isArray(group.pickup_route)
    ? group.pickup_route
    : (group.pickup_route ? JSON.parse(group.pickup_route) : []);

  // ✅ Total distance = sum of all vendor distances from pickup_route
  // This is the full route distance the delivery boy rides, not just one vendor
  const totalDistance = pickupRoute.reduce(
    (sum, stop) => sum + (Number(stop.distance_km) || 0),
    0
  );

  // Build a lookup: order_id → stop_index from pickup_route
  const stopIndexMap = new Map<string, number>(
    pickupRoute.map((stop) => [stop.order_id, stop.stop_index])
  );

  const vendors: GroupVendorStop[] = orders
    .filter((o: any) => o.status !== 'cancelled')
    // ✅ Sort by stop_index from pickup_route — not by delivery_fee
    .sort((a: any, b: any) => {
      const aIdx = stopIndexMap.get(a.id) ?? 999;
      const bIdx = stopIndexMap.get(b.id) ?? 999;
      return aIdx - bIdx;
    })
    .map((o: any, idx: number) => {
      const items: GroupOrderItem[] = (o.order_items || []).map((i: any) => {
        const unitPrice      = Number(i.unit_price      ?? 0);
        const discountPrice  = i.discount_price ? Number(i.discount_price) : null;
        const effectivePrice = discountPrice && discountPrice > 0 ? discountPrice : unitPrice;
        const quantity       = Number(i.quantity ?? 1);

        return {
          id:                i.id,
          product_id:        i.product_id,
          name:              i.product_name    ?? 'Unknown item',
          product_image:     i.product_image   ?? null,
          qty:               `${quantity} × ₹${effectivePrice.toFixed(2)}`,
          quantity,
          unit_price:        unitPrice,
          discount_price:    discountPrice,
          effective_price:   effectivePrice,
          total_price:       Number(i.total_price        ?? 0),
          commission_rate:   Number(i.commission_rate    ?? 0),
          commission_amount: Number(i.commission_amount  ?? 0),
          status:            i.status ?? 'active',
        };
      });

      return {
        order_id:             o.id,
        vendor_id:            o.vendors?.user_id    ?? o.vendor_id,
        vendor_name:          o.vendors?.store_name ?? '',
        address:              `${o.vendors?.address ?? ''}, ${o.vendors?.city ?? ''}`
                                ?.replace(/^,\s*|,\s*$/g, '').trim(),
        latitude:             o.vendors?.latitude   ?? null,
        longitude:            o.vendors?.longitude  ?? null,
        stop_index:           stopIndexMap.get(o.id) ?? idx + 1,  // ✅ from pickup_route
        status:               o.status,
        picked_up_at:         o.picked_up_at        ?? null,
        subtotal:             Number(o.subtotal      ?? 0),
        delivery_fee:         Number(o.delivery_fee_paid_by_customer ?? o.delivery_fee ?? 0),
        total_amount:         Number(o.total_amount  ?? 0),
        special_instructions: o.special_instructions ?? null,
        items,
      };
    });

  const otp = group.delivery_otp ?? '';

  const totalItems = vendors.reduce(
    (sum, v) => sum + v.items.filter((i) => i.status !== 'cancelled').length,
    0
  );

  return {
    id:                group.id,
    status:            group.status,
    assignment_status: group.assignment_status,
    payment_method:    group.payment_method,
    total_amount:      Number(group.total_amount  ?? 0),
    delivery_fee:      Number(group.delivery_fee  ?? 0),
    subtotal:          Number(group.subtotal       ?? 0),
    is_free_delivery:  group.is_free_delivery      ?? false,
    created_at:        group.created_at,
    pickup_route:      group.pickup_route,
    payout:            Number(group.delivery_fee  ?? 0),
    totalItems,
    // ✅ sum of all vendor distances from pickup_route, rounded to 1 decimal
    distance:          Math.round(totalDistance * 10) / 10,
    otp,
    cod_status:           group.cod_status           ?? null,
    cod_amount:           group.cod_amount           ? Number(group.cod_amount) : null,
    cod_deposit_deadline: group.cod_deposit_deadline ?? null,
    cod_deposited_at:     group.cod_deposited_at     ?? null,
    cod_deposit_notes:    group.cod_deposit_notes    ?? null,
    customer: {
      name:    `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
      phone,
      address: customerAddr,
      lat:     customerLat,
      lng:     customerLng,
    },
    vendors,
    orders: orders.map((o: any) => ({ id: o.id, status: o.status })),
  };
}

// ─── QUERY: Available Groups ──────────────────────────────────────────────────

export function useAvailableDeliveryGroups() {
  return useQuery({
    queryKey: deliveryQueryKeys.groups.available(),
    queryFn: async (): Promise<DeliveryGroup[]> => {
      const { data, error } = await supabase
        .from('order_groups')
        .select(ORDER_GROUP_SELECT)
        .eq('assignment_status', 'broadcasting')
        .is('delivery_boy_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data
        .filter((g) =>
          g.customers &&
          g.orders?.some((o: any) => o.status !== 'cancelled') &&
          g.customers?.users?.phone
        )
        .map(mapGroupToDelivery);
    },
    refetchInterval: 30000,
  });
}

// ─── QUERY: Active Groups ─────────────────────────────────────────────────────

export function useActiveDeliveryGroups() {
  const session       = useAuthStore((s) => s.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.groups.active(deliveryBoyId!),
    queryFn: async (): Promise<DeliveryGroup[]> => {
      if (!deliveryBoyId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('order_groups')
        .select(ORDER_GROUP_SELECT)
        .eq('delivery_boy_id', deliveryBoyId)
        .in('assignment_status', ['assigned', 'picking_up', 'delivering'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map(mapGroupToDelivery);
    },
    enabled:         !!deliveryBoyId,
    refetchInterval: 15000,
  });
}

// ─── QUERY: Completed Groups ──────────────────────────────────────────────────

export function useCompletedDeliveryGroups() {
  const session       = useAuthStore((s) => s.session);
  const deliveryBoyId = session?.user?.id;

  return useQuery({
    queryKey: deliveryQueryKeys.groups.completed(deliveryBoyId!),
    queryFn: async (): Promise<DeliveryGroup[]> => {
      if (!deliveryBoyId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('order_groups')
        .select(ORDER_GROUP_SELECT)
        .eq('delivery_boy_id', deliveryBoyId)
        .eq('assignment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map(mapGroupToDelivery);
    },
    enabled: !!deliveryBoyId,
  });
}

// ─── QUERY: Group Detail ──────────────────────────────────────────────────────

export function useDeliveryGroupDetail(groupId: string) {
  return useQuery({
    queryKey: deliveryQueryKeys.groups.detail(groupId),
    queryFn: async (): Promise<DeliveryGroup> => {
      if (!groupId) throw new Error('Group ID required');

      const { data, error } = await supabase
        .from('order_groups')
        .select(ORDER_GROUP_DETAIL_SELECT)
        .eq('id', groupId)
        .single();

      if (error) throw error;
      if (!data)  throw new Error('Group not found');

      return mapGroupToDelivery(data);
    },
    enabled:   !!groupId,
    staleTime: 0,
  });
}

// ─── QUERY: Stats ─────────────────────────────────────────────────────────────

export function useDeliveryBoyStats() {
  const session       = useAuthStore((s) => s.session);
  const deliveryBoyId = session?.user?.id;

  // Fetch wallet first
  const walletQuery = useQuery({
    queryKey: ['delivery-wallet', deliveryBoyId],
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', deliveryBoyId)
        .eq('user_type', 'delivery_boy')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!deliveryBoyId,
    staleTime: 1000 * 60 * 2,
  });

  // Fetch all credit transactions for client-side period calc
  const txQuery = useQuery({
    queryKey: ['delivery-wallet-tx', deliveryBoyId],
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Not authenticated');
      const walletId = walletQuery.data?.id;
      if (!walletId) return [];

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('amount, created_at')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit')
        .not('created_at', 'is', null)
        .order('created_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!deliveryBoyId && !!walletQuery.data?.id,
    staleTime: 1000 * 60,
  });

  // Fetch group stats
  const groupQuery = useQuery({
    queryKey: deliveryQueryKeys.stats(deliveryBoyId!),
    queryFn: async () => {
      if (!deliveryBoyId) throw new Error('Not authenticated');

      const { data: groups, error } = await supabase
        .from('order_groups')
        .select('assignment_status')
        .eq('delivery_boy_id', deliveryBoyId);

      if (error) throw error;

      return {
        totalGroups:     groups?.length || 0,
        completedGroups: groups?.filter((g) => g.assignment_status === 'completed').length || 0,
        activeGroups:    groups?.filter((g) =>
          ['assigned', 'picking_up', 'delivering'].includes(g.assignment_status || '')
        ).length || 0,
      };
    },
    enabled: !!deliveryBoyId,
    staleTime: 1000 * 60 * 2,
  });

  // Client-side period calculation — no stale DB columns
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartMs = weekStart.getTime();

  const earningsToday = (txQuery.data ?? []).reduce((sum, tx) => {
    if (!tx.created_at) return sum;
    const raw = tx.created_at.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
    return new Date(raw).getTime() >= todayStartMs
      ? sum + Number(tx.amount)
      : sum;
  }, 0);

  const earningsThisWeek = (txQuery.data ?? []).reduce((sum, tx) => {
    if (!tx.created_at) return sum;
    const raw = tx.created_at.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
    return new Date(raw).getTime() >= weekStartMs
      ? sum + Number(tx.amount)
      : sum;
  }, 0);

  return {
    data: groupQuery.data ? {
      totalGroups:      groupQuery.data.totalGroups,
      activeGroups:     groupQuery.data.activeGroups,
      completedGroups:  groupQuery.data.completedGroups,
      totalEarnings:    Number(walletQuery.data?.lifetime_earnings ?? 0),
      availableBalance: Number(walletQuery.data?.available_balance ?? 0),
      earningsToday,
      earningsThisWeek,
    } : undefined,
    isLoading: walletQuery.isLoading || groupQuery.isLoading || txQuery.isLoading,
  };
}

// ─── MUTATION: Accept Group ───────────────────────────────────────────────────

export function useAcceptDeliveryGroup() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (groupId: string) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('accept_order_group', {
        p_order_group_id:  groupId,
        p_delivery_boy_id: deliveryBoyId,
      });

      if (error) throw error;
      if (!data.success) {
        const err: any = new Error(data.message);
        err.active_group_id = data.active_group_id ?? null;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.available() });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.active(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.stats(deliveryBoyId) });
    },
  });
}

// ─── MUTATION: Mark Order Picked Up ──────────────────────────────────────────

export function useMarkOrderPickedUp() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async ({ orderId, groupId }: { orderId: string; groupId: string }) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('mark_order_group_picked_up', {
        p_order_id:        orderId,
        p_delivery_boy_id: deliveryBoyId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return { ...data, groupId };
    },
    onSuccess: (data) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.active(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.detail(data.groupId) });
    },
  });
}

// ─── MUTATION: Complete Group Delivery ───────────────────────────────────────

export function useCompleteGroupDelivery() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async ({ groupId, otp }: { groupId: string; otp: string }) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('complete_group_delivery', {
        p_order_group_id:  groupId,
        p_delivery_boy_id: deliveryBoyId,
        p_otp:             otp,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (_data, { groupId }) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.active(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.completed(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.stats(deliveryBoyId) });
    },
  });
}

// ─── MUTATION: Report COD Deposit ────────────────────────────────────────────

export function useReportCodDeposit() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((s) => s.session);

  return useMutation({
    mutationFn: async (groupId: string) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('report_cod_deposit', {
        p_delivery_boy_id: deliveryBoyId,
        p_order_group_id:  groupId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (_data, groupId) => {
      const deliveryBoyId = session?.user?.id;
      if (!deliveryBoyId) return;
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.groups.completed(deliveryBoyId) });
      queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.stats(deliveryBoyId) });
    },
  });
}