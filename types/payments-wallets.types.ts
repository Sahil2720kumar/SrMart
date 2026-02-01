export type WalletUserType = 'vendor' | 'delivery_boy';
export type TransactionType = 'credit' | 'debit';

export interface Wallet {
  id: string;
  user_id: string; // references users.auth_id
  user_type: WalletUserType;
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  earnings_today: number;
  earnings_this_week: number;
  earnings_this_month: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: TransactionType;
  amount: number;
  order_id?: string;
  cashout_id?: string;
  description: string;
  balance_after: number;
  metadata: Record<string, any>;
  created_at: string;
}

export type BankAccountType = 'savings' | 'current';

export type BankVerificationStatus =
  | 'not_added'
  | 'pending'
  | 'approved'
  | 'rejected';




export interface VendorBankDetails {
  id: string;
  vendor_id: string; // references vendors.user_id
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  branch?: string;
  account_type?: BankAccountType;
  upi_id?: string;
  proof_image?: string;
  status: BankVerificationStatus;
  rejection_reason?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryBoyBankDetails {
  id: string;
  delivery_boy_id: string; // references delivery_boys.user_id
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  branch?: string;
  account_type?: BankAccountType;
  upi_id?: string;
  proof_image?: string;
  status: BankVerificationStatus;
  rejection_reason?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}
