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

export type BankAccountType = 'savings' | 'current';

export type BankVerificationStatus =
  | 'not_added'
  | 'pending'
  | 'approved'
  | 'rejected';


export interface DeliveryBoyBankDetails {
  id: string; // uuid
  delivery_boy_id: string; // uuid

  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;

  branch?: string | null;
  account_type?: BankAccountType | null;
  upi_id?: string | null;
  proof_image?: string | null;

  status: BankVerificationStatus;
  rejection_reason?: string | null;

  is_verified: boolean;
  verified_at?: string | null; // timestamptz (ISO string)
  verified_by?: string | null; // uuid

  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface VendorBankDetails {
  id: string; // uuid
  vendor_id: string; // uuid

  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;

  branch?: string | null;
  account_type?: BankAccountType | null;
  upi_id?: string | null;
  proof_image?: string | null;

  status: BankVerificationStatus;
  rejection_reason?: string | null;

  is_verified: boolean;
  verified_at?: string | null; // timestamptz
  verified_by?: string | null; // uuid

  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
