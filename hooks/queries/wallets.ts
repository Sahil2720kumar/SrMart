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
  },
  cashouts: {
    all: ['cashout-requests'] as const,
    byWallet: (walletId: string) => ['cashout-requests', 'wallet', walletId] as const,
    recent: (walletId: string, limit: number) => ['cashout-requests', 'wallet', walletId, 'recent', limit] as const,
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 2, // 2 minutes
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
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

// ============================================
// BANK ACCOUNT QUERIES
// ============================================





/**
 * Generic hook to get bank details based on user type
 * Automatically determines whether to fetch vendor or delivery boy bank details
 */
export function useBankDetails(userType: WalletUserType, userId?: string) {
  const {session}=useAuthStore()
  const vendorBank = useVendorBankDetails(session?.user.id || "" );
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
 * Request a cashout
 */
export function useRequestCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cashoutData: CreateCashoutRequest) => {
      // Generate request number (format: CRQ-YYYYMMDD-XXXX)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const requestNumber = `CRQ-${dateStr}-${randomNum}`;

      const { data, error } = await supabase
        .from('cashout_requests')
        .insert({
          wallet_id: cashoutData.wallet_id,
          amount: cashoutData.amount,
          request_number: requestNumber,
          status: 'pending',
          request_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Also update the wallet to move balance from available to pending
      const { error: walletError } = await supabase.rpc('process_cashout_request', {
        p_wallet_id: cashoutData.wallet_id,
        p_amount: cashoutData.amount,
      });

      if (walletError) throw walletError;

      return data as CashoutRequest;
    },
    onSuccess: (data) => {
      // Invalidate wallet to refresh balances
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.all,
      });
      // Invalidate cashouts
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.cashouts.byWallet(data.wallet_id),
      });
      // Invalidate transactions
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.transactions.byWallet(data.wallet_id),
      });
    },
    onError: (error) => {
      console.error('Error requesting cashout:', error);
    },
  });
}

/**
 * Cancel a pending cashout request
 */
export function useCancelCashout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cashoutId: string) => {
      const { data, error } = await supabase
        .from('cashout_requests')
        .update({ status: 'cancelled' })
        .eq('id', cashoutId)
        .eq('status', 'pending') // Can only cancel pending requests
        .select()
        .single();

      if (error) throw error;

      // Call RPC to return balance to available
      const { error: walletError } = await supabase.rpc('cancel_cashout_request', {
        p_cashout_id: cashoutId,
      });

      if (walletError) throw walletError;

      return data as CashoutRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.cashouts.byWallet(data.wallet_id),
      });
      queryClient.invalidateQueries({
        queryKey: walletQueryKeys.transactions.byWallet(data.wallet_id),
      });
    },
    onError: (error) => {
      console.error('Error cancelling cashout:', error);
    },
  });
}



// ============================================
// HELPER HOOKS
// ============================================

/**
 * Combined hook to get all wallet-related data
 * @param userId - User ID (defaults to current session user)
 * @param userType - 'vendor' or 'delivery_boy' (required for bank details and wallet creation)
 * @param entityId - vendor_id or delivery_boy_id (required for bank details)
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
  const bankDetails = useBankDetails(userType || 'delivery_boy', entityId);

  return {
    wallet,
    transactions,
    cashouts,
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