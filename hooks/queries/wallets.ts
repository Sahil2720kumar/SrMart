// hooks/queries/wallets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Wallet,
  WalletTransaction,
  CashoutRequest,
  WalletUserType,
} from '@/types/payments-wallets.types';
import { useAuthStore } from '@/store/authStore';
import { useDeliveryBoyBankDetails, useVendorBankDetails } from '.';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const walletQueryKeys = {
  all: ['wallets'] as const,
  byUser: (userId: string) => ['wallets', 'user', userId] as const,
  transactions: {
    all: ['wallet-transactions'] as const,
    byWallet: (walletId: string) => ['wallet-transactions', 'wallet', walletId] as const,
    recent: (walletId: string, limit: number) => ['wallet-transactions', 'wallet', walletId, 'recent', limit] as const,
    byPeriod: (walletId: string, period: 'today' | 'week' | 'month') =>
      ['wallet-transactions', 'wallet', walletId, 'period', period] as const,
  },
  cashouts: {
    all: ['cashout-requests'] as const,
    byWallet: (walletId: string) => ['cashout-requests', 'wallet', walletId] as const,
    recent: (walletId: string, limit: number) => ['cashout-requests', 'wallet', walletId, 'recent', limit] as const,
    pending: (walletId: string) => ['cashout-requests', 'wallet', walletId, 'pending'] as const,
  },
  deliveryEarnings: (deliveryBoyId: string) => ['delivery-earnings', deliveryBoyId] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeliveryEarningEntry {
  earning_id:        string;
  order_group_id:    string | null;
  order_id:          string;
  order_number:      string | null;
  earned_at:         string;
  base_fee:          number;
  total_earnings:    number;
  status:            string;
  payment_method:    string | null;
  cod_status:        string | null;
  vendor_names:      string;
  order_count:       number;
  customer_name:     string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodStart(period: 'today' | 'week' | 'month'): Date {
  const now = new Date();

  switch (period) {
    case 'today': {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0, 0, 0, 0
      );
      return d;
    }
    case 'week': {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay(), // Sunday = 0
        0, 0, 0, 0
      );
      return d;
    }
    case 'month': {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0, 0, 0, 0
      );
      return d;
    }
  }
}

// ─── WALLET ───────────────────────────────────────────────────────────────────

export function useWallet(userId?: string, userType?: WalletUserType) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  return useQuery({
    queryKey: walletQueryKeys.byUser(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', id)
        .single();

      if (data) return data as Wallet;
      if (error && error.code !== 'PGRST116') throw error;

      if (!userType) throw new Error('userType is required to create a new wallet');

      const { data: walletId, error: rpcError } = await supabase.rpc('ensure_wallet', {
        p_user_auth_id: id,
        p_user_type:    userType,
      });

      if (rpcError) throw rpcError;

      const { data: newWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (fetchError) throw fetchError;
      return newWallet as Wallet;
    },
    enabled:   !!id,
    staleTime: 1000 * 60 * 2,
  });
}

// ─── WALLET TRANSACTIONS ──────────────────────────────────────────────────────

export function useWalletTransactions(walletId: string) {
  return useQuery({
    queryKey: walletQueryKeys.transactions.byWallet(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled:   !!walletId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecentWalletTransactions(walletId: string, limit: number = 10) {
  return useQuery({
    queryKey: walletQueryKeys.transactions.recent(walletId, limit),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled:   !!walletId,
    staleTime: 1000 * 60,
  });
}

// Fetch ALL credit transactions for a wallet — period filtering done client-side
export function useAllCreditTransactions(walletId: string) {
  return useQuery({
    queryKey: walletQueryKeys.transactions.byWallet(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit')
        .not('order_id', 'is', null)
        .not('created_at', 'is', null)  // ← exclude null created_at rows
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled:   !!walletId,
    staleTime: 1000 * 60,
  });
}

// ─── DELIVERY EARNINGS (enriched with group info) ────────────────────────────

export function useDeliveryEarnings(deliveryBoyId: string) {
  return useQuery({
    queryKey: walletQueryKeys.deliveryEarnings(deliveryBoyId),
    queryFn: async (): Promise<DeliveryEarningEntry[]> => {
      if (!deliveryBoyId) throw new Error('deliveryBoyId required');

      const { data, error } = await supabase
        .from('delivery_earnings')
        .select(`
          id,
          order_id,
          base_fee,
          total_earnings,
          status,
          earned_at,
          orders!inner(
            order_number,
            order_group_id,
            payment_method,
            cod_status,
            order_groups(
              id,
              delivery_fee,
              cod_status,
              orders(
                vendors!inner(store_name)
              ),
              customers!inner(
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('delivery_boy_id', deliveryBoyId)
        .eq('status', 'completed')
        .order('earned_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((e: any): DeliveryEarningEntry => {
        const order      = e.orders;
        const group      = order?.order_groups;
        const groupOrders = group?.orders || [];
        const customer   = group?.customers;

        const vendorNames = groupOrders
          .map((o: any) => o.vendors?.store_name)
          .filter(Boolean)
          .join(', ') || 'Unknown vendor';

        return {
          earning_id:     e.id,
          order_group_id: order?.order_group_id ?? null,
          order_id:       e.order_id,
          order_number:   order?.order_number   ?? null,
          earned_at: e.earned_at ?? e.created_at ?? new Date().toISOString(),
          base_fee:       Number(e.base_fee      ?? 0),
          total_earnings: Number(e.total_earnings ?? 0),
          status:         e.status,
          payment_method: order?.payment_method  ?? null,
          cod_status:     group?.cod_status      ?? order?.cod_status ?? null,
          vendor_names:   vendorNames,
          order_count:    groupOrders.length || 1,
          customer_name:  customer
            ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
            : null,
        };
      });
    },
    enabled:   !!deliveryBoyId,
    staleTime: 1000 * 60 * 2,
  });
}

// ─── CASHOUTS ─────────────────────────────────────────────────────────────────

export function useCashoutRequests(walletId: string) {
  return useQuery({
    queryKey: walletQueryKeys.cashouts.byWallet(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CashoutRequest[];
    },
    enabled:   !!walletId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useRecentCashouts(walletId: string, limit: number = 5) {
  return useQuery({
    queryKey: walletQueryKeys.cashouts.recent(walletId, limit),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as CashoutRequest[];
    },
    enabled:   !!walletId,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePendingCashouts(walletId: string) {
  return useQuery({
    queryKey: walletQueryKeys.cashouts.pending(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('wallet_id', walletId)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CashoutRequest[];
    },
    enabled:   !!walletId,
    staleTime: 1000 * 60,
  });
}

// ─── BANK DETAILS ─────────────────────────────────────────────────────────────

export function useBankDetails(userType: WalletUserType, userId?: string) {
  const { session } = useAuthStore();
  const vendorBank      = useVendorBankDetails(session?.user.id || '');
  const deliveryBoyBank = useDeliveryBoyBankDetails(session?.user.id || '');
  return userType === 'vendor' ? vendorBank : deliveryBoyBank;
}

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

export function useCreateWallet() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (walletData: Partial<Wallet>) => {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id:             session?.user?.id,
          available_balance:   0,
          pending_balance:     0,
          lifetime_earnings:   0,
          earnings_today:      0,
          earnings_this_week:  0,
          earnings_this_month: 0,
          total_withdrawn:     0,
          ...walletData,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(walletQueryKeys.byUser(session?.user?.id!), data);
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
    },
  });
}

export function useRequestCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wallet_id, amount }: { wallet_id: string; amount: number }) => {
      const { data: cashoutId, error } = await supabase.rpc('request_cashout', {
        p_wallet_id: wallet_id,
        p_amount:    amount,
      });

      if (error) throw error;

      const { data: cashoutRequest, error: fetchError } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('id', cashoutId)
        .single();

      if (fetchError) throw fetchError;
      return cashoutRequest as CashoutRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.cashouts.byWallet(data.wallet_id) });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.transactions.byWallet(data.wallet_id) });
    },
  });
}

export function useCancelCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { data: cashout, error: fetchError } = await supabase
        .from('cashout_requests')
        .select('wallet_id')
        .eq('id', cashoutId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase.rpc('cancel_cashout', { p_cashout_id: cashoutId });
      if (error) throw error;

      return { walletId: cashout.wallet_id };
    },
    onSuccess: ({ walletId }) => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.cashouts.byWallet(walletId) });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.transactions.byWallet(walletId) });
    },
  });
}

export function useApproveCashout() {
  const queryClient = useQueryClient();
  const session     = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { error } = await supabase.rpc('approve_cashout', {
        p_cashout_id:  cashoutId,
        p_approved_by: session?.user?.id,
      });
      if (error) throw error;
      return cashoutId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.cashouts.all });
    },
  });
}

export function useCompleteCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cashoutId,
      transactionReference,
    }: {
      cashoutId: string;
      transactionReference: string;
    }) => {
      const { error } = await supabase.rpc('complete_cashout', {
        p_cashout_id:            cashoutId,
        p_transaction_reference: transactionReference,
      });
      if (error) throw error;
      return cashoutId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.cashouts.all });
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.transactions.all });
    },
  });
}

// ─── EARNINGS STATS (client-side period calc) ────────────────────────────────

export function useEarningsStats(walletId: string, period: 'today' | 'week' | 'month') {
  const allTx = useAllCreditTransactions(walletId);

  const periodStart    = getPeriodStart(period);
  const periodStartMs  = periodStart.getTime();

  const filtered = (allTx.data ?? []).filter((tx) => {
    if (!tx.created_at) return false;
    const raw      = tx.created_at.replace(/([+-]\d{2}:\d{2}|Z)$/, '');
    const txDateMs = new Date(raw).getTime();
    return txDateMs >= periodStartMs;
  });

  let totalEarnings = 0;
  let orders        = 0;
  let distance      = 0;
  let baseEarnings  = 0;

  filtered.forEach((tx) => {
    const amount = Number(tx.amount);
    totalEarnings += amount;
    orders        += 1;

    const meta = tx.metadata as any;
    if (meta?.distance_km)  distance     += Number(meta.distance_km);
    if (meta?.delivery_fee) baseEarnings += Number(meta.delivery_fee);
    else                    baseEarnings += amount;
  });

  return {
    totalEarnings,
    orders,
    distance,
    baseEarnings,
    transactions: filtered,
    isLoading: allTx.isLoading,
    isError:   allTx.isError,
    refetch:   allTx.refetch,
  };
}


// ─── COMBINED HOOK (kept for backward compatibility) ─────────────────────────

export function useWalletData(
  userId?: string,
  userType?: WalletUserType,
  entityId?: string
) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  const wallet          = useWallet(id, userType);
  const transactions    = useRecentWalletTransactions(wallet.data?.id ?? '', 10);
  const cashouts        = useRecentCashouts(wallet.data?.id ?? '', 5);
  const pendingCashouts = usePendingCashouts(wallet.data?.id ?? '');
  const bankDetails     = useBankDetails(userType ?? 'delivery_boy', entityId);

  return {
    wallet,
    transactions,
    cashouts,
    pendingCashouts,
    bankDetails,
    isLoading:
      wallet.isLoading ||
      transactions.isLoading ||
      cashouts.isLoading ||
      bankDetails.isLoading,
    isError:
      wallet.isError ||
      transactions.isError ||
      cashouts.isError ||
      bankDetails.isError,
  };
}