export interface Wallet {
  id: string;
  user_id: string;
  user_type: 'vendor' | 'delivery_boy';
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  order_id?: string;
  description: string;
  balance_after: number;
  created_at: string;
}
