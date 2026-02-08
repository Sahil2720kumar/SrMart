import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Wallet,
  WalletTransaction,
  CashoutRequest,
  VendorBankDetails,
  DeliveryBoyBankDetails,
  WalletUserType,
} from '@/types/payments-wallets.types';
import { useAuthStore } from '@/store/authStore';
import { useDeliveryBoyBankDetails, useVendorBankDetails } from '.';

// Query Keys
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
  bankAccounts: {
    vendor: {
      all: ['vendor-bank-details'] as const,
      byVendor: (vendorId: string) => ['vendor-bank-details', 'vendor', vendorId] as const,
    },
    deliveryBoy: {
      all: ['delivery-boy-bank-details'] as const,
      byDeliveryBoy: (deliveryBoyId: string) => ['delivery-boy-bank-details', 'delivery-boy', deliveryBoyId] as const,
    },
  },
};

// ============================================
// WALLET QUERIES
// ============================================

/**
 * Get wallet for the current user or specific user
 * Automatically creates wallet if it doesn't exist
 */
export function useWallet(userId?: string, userType?: WalletUserType) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  return useQuery({
    queryKey: walletQueryKeys.byUser(id!),
    queryFn: async () => {
      // First try to get existing wallet
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', id)
        .single();

      // If wallet exists, return it
      if (data) {
        return data as Wallet;
      }

      // If error is not "no rows found", throw it
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Wallet doesn't exist, create it using RPC
      if (!userType) {
        throw new Error('userType is required to create a new wallet');
      }

      const { data: walletId, error: rpcError } = await supabase.rpc(
        'ensure_wallet',
        {
          p_user_auth_id: id,
          p_user_type: userType,
        }
      );

      if (rpcError) throw rpcError;

      // Fetch the newly created wallet
      const { data: newWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (fetchError) throw fetchError;

      return newWallet as Wallet;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================
// WALLET TRANSACTION QUERIES
// ============================================

/**
 * Get all transactions for a wallet
 */
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
    enabled: !!walletId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get recent transactions for a wallet
 */
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
    enabled: !!walletId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

/**
 * Get transactions filtered by time period
 */
export function useTransactionsByPeriod(
  walletId: string, 
  period: 'today' | 'week' | 'month'
) {
  return useQuery({
    queryKey: walletQueryKeys.transactions.byPeriod(walletId, period),
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          const day = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - day); // Start of week (Sunday)
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit') // Only earnings
        .not('order_id', 'is', null) // Only order-related earnings
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!walletId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// ============================================
// CASHOUT QUERIES
// ============================================

/**
 * Get all cashout requests for a wallet
 */
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
    enabled: !!walletId,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

/**
 * Get recent cashout requests for a wallet
 */
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
    enabled: !!walletId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get pending and approved cashout requests for a wallet
 */
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
    enabled: !!walletId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

// ============================================
// BANK ACCOUNT QUERIES
// ============================================

/**
 * Generic hook to get bank details based on user type
 */
export function useBankDetails(userType: WalletUserType, userId?: string) {
  const { session } = useAuthStore();
  const vendorBank = useVendorBankDetails(session?.user.id || "");
  const deliveryBoyBank = useDeliveryBoyBankDetails(session?.user.id || "");

  return userType === 'vendor' ? vendorBank : deliveryBoyBank;
}

// ============================================
// WALLET MUTATIONS
// ============================================

/**
 * Create a wallet for a user (typically done on signup)
 */
export function useCreateWallet() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (walletData: Partial<Wallet>) => {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: session?.user?.id,
          available_balance: 0,
          pending_balance: 0,
          lifetime_earnings: 0,
          earnings_today: 0,
          earnings_this_week: 0,
          earnings_this_month: 0,
          total_withdrawn: 0,
          ...walletData,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        walletQueryKeys.byUser(session?.user?.id!),
        data
      );
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
    },
    onError: (error) => {
      console.error('Error creating wallet:', error);
    },
  });
}

// ============================================
// CASHOUT MUTATIONS
// ============================================

export interface CreateCashoutRequest {
  wallet_id: string;
  amount: number;
}

/**
 * Request a cashout using the RPC function
 * CORRECTED: Uses 'request_cashout' RPC
 */
export function useRequestCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cashoutData: CreateCashoutRequest) => {
      // Call the RPC function - it handles everything atomically
      const { data: cashoutId, error } = await supabase.rpc('request_cashout', {
        p_wallet_id: cashoutData.wallet_id,
        p_amount: cashoutData.amount,
      });

      if (error) throw error;

      // Fetch the created cashout request
      const { data: cashoutRequest, error: fetchError } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('id', cashoutId)
        .single();

      if (fetchError) throw fetchError;

      return cashoutRequest as CashoutRequest;
    },
    onSuccess: (data) => {
      // Invalidate all wallet-related queries
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.cashouts.byWallet(data.wallet_id),
      });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.transactions.byWallet(data.wallet_id),
      });
    },
    onError: (error) => {
      console.error('Error requesting cashout:', error);
      throw error;
    },
  });
}

/**
 * Cancel a pending cashout request
 * CORRECTED: Uses 'cancel_cashout' RPC
 */
export function useCancelCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cashoutId: string) => {
      // First get the wallet_id for invalidation
      const { data: cashout, error: fetchError } = await supabase
        .from('cashout_requests')
        .select('wallet_id')
        .eq('id', cashoutId)
        .single();

      if (fetchError) throw fetchError;

      // Call RPC to cancel
      const { error } = await supabase.rpc('cancel_cashout', {
        p_cashout_id: cashoutId,
      });

      if (error) throw error;

      // Fetch updated cashout request
      const { data, error: refetchError } = await supabase
        .from('cashout_requests')
        .select('*')
        .eq('id', cashoutId)
        .single();

      if (refetchError) throw refetchError;

      return { data: data as CashoutRequest, walletId: cashout.wallet_id };
    },
    onSuccess: ({ data, walletId }) => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.cashouts.byWallet(walletId),
      });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.transactions.byWallet(walletId),
      });
    },
    onError: (error) => {
      console.error('Error cancelling cashout:', error);
      throw error;
    },
  });
}

/**
 * Approve a cashout request (Admin only)
 */
export function useApproveCashout() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (cashoutId: string) => {
      // Get wallet_id for invalidation
      const { data: cashout, error: fetchError } = await supabase
        .from('cashout_requests')
        .select('wallet_id')
        .eq('id', cashoutId)
        .single();

      if (fetchError) throw fetchError;

      // Call RPC to approve
      const { error } = await supabase.rpc('approve_cashout', {
        p_cashout_id: cashoutId,
        p_approved_by: session?.user?.id,
      });

      if (error) throw error;

      return { cashoutId, walletId: cashout.wallet_id };
    },
    onSuccess: ({ walletId }) => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.cashouts.all,
      });
    },
    onError: (error) => {
      console.error('Error approving cashout:', error);
      throw error;
    },
  });
}

/**
 * Complete a cashout request (Admin only)
 */
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
      // Get wallet_id for invalidation
      const { data: cashout, error: fetchError } = await supabase
        .from('cashout_requests')
        .select('wallet_id')
        .eq('id', cashoutId)
        .single();

      if (fetchError) throw fetchError;

      // Call RPC to complete
      const { error } = await supabase.rpc('complete_cashout', {
        p_cashout_id: cashoutId,
        p_transaction_reference: transactionReference,
      });

      if (error) throw error;

      return { cashoutId, walletId: cashout.wallet_id };
    },
    onSuccess: ({ walletId }) => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.cashouts.all,
      });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.transactions.all,
      });
    },
    onError: (error) => {
      console.error('Error completing cashout:', error);
      throw error;
    },
  });
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Combined hook to get all wallet-related data
 */
export function useWalletData(
  userId?: string,
  userType?: WalletUserType,
  entityId?: string
) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  const wallet = useWallet(id, userType);
  const transactions = useRecentWalletTransactions(wallet.data?.id!, 10);
  const cashouts = useRecentCashouts(wallet.data?.id!, 5);
  const pendingCashouts = usePendingCashouts(wallet.data?.id!);
  const bankDetails = useBankDetails(userType || 'delivery_boy', entityId);

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

/**
 * Hook to calculate earnings stats for a specific period
 */
export function useEarningsStats(walletId: string, period: 'today' | 'week' | 'month') {
  const wallet = useQuery({
    queryKey: walletQueryKeys.byUser(walletId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (error) throw error;
      return data as Wallet;
    },
    enabled: !!walletId,
  });

  const transactions = useTransactionsByPeriod(walletId, period);

  // Calculate stats from transactions
  const stats = {
    totalEarnings: 0,
    orders: 0,
    distance: 0,
    baseEarnings: 0,
    incentives: 0,
    tips: 0,
  };

  if (transactions.data && transactions.data.length > 0) {
    transactions.data.forEach((tx) => {
      const amount = parseFloat(tx.amount);
      stats.totalEarnings += amount;
      stats.orders += 1;

      // Extract metadata if available
      const metadata = tx.metadata as any;
      if (metadata) {
        if (metadata.distance_km) {
          stats.distance += parseFloat(metadata.distance_km);
        }
        if (metadata.delivery_fee) {
          stats.baseEarnings += parseFloat(metadata.delivery_fee);
        }
      }
    });
  }

  // Use wallet period earnings as primary source
  if (wallet.data) {
    const walletEarnings = 
      period === 'today' ? parseFloat(wallet.data.earnings_today) :
      period === 'week' ? parseFloat(wallet.data.earnings_this_week) :
      parseFloat(wallet.data.earnings_this_month);
    
    // Use wallet value if it's more than calculated
    if (walletEarnings > stats.totalEarnings) {
      stats.totalEarnings = walletEarnings;
    }
    
    // If no transactions but wallet shows earnings, at least show the total
    if (stats.orders === 0 && walletEarnings > 0) {
      stats.totalEarnings = walletEarnings;
      stats.baseEarnings = walletEarnings;
    }
  }

  return {
    ...stats,
    transactions: transactions.data || [],
    isLoading: transactions.isLoading || wallet.isLoading,
    isError: transactions.isError || wallet.isError,
    refetch: () => {
      wallet.refetch();
      transactions.refetch();
    },
  };
}