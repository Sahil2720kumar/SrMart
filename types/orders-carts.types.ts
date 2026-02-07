import { Vendor } from "./users.types";

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'all';

export type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet';

export type PaymentStatus =  'pending' | 'paid' | 'failed' | 'refunded';

export type CancelledBy = 'customer' | 'vendor' | 'admin' | 'system';

export type OrderFilterStatus = OrderStatus | 'all' | 'active' | 'completed';

export interface OrderFilters {
  status?: OrderFilterStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OrderGroup {
  id: string;
  customer_id: string;

  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;

  payment_method: string | null;
  payment_status: PaymentStatus;

  subtotal: number;

  tax: number | null;
  delivery_fee: number | null;
  discount: number | null;
  coupon_discount: number | null;

  total_amount: number | null;

  coupon_id: string | null;

  is_free_delivery: boolean;

  created_at: string;
  updated_at: string;
}


export interface Order {
  id: string;

  customer_id: string;
  vendor_id: string;
  delivery_boy_id: string | null;
  delivery_address_id: string;

  coupon_id: string | null;
  order_group_id: string | null;

  order_number: string;

  status: OrderStatus;

  item_count: number;

  subtotal: number;
  delivery_fee: number;
  tax: number;
  tax_percentage: number;

  discount: number;
  coupon_discount: number;

  total_amount: number;

  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_id: string | null;

  special_instructions: string | null;
  cancellation_reason: string | null;
  cancelled_by: CancelledBy | null;

  created_at: string;
  updated_at: string;

  confirmed_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;

  vendor_accepted_at: string | null;

  is_free_delivery: boolean;
  delivery_fee_paid_by_customer: number;

  total_commission: number;
  platform_net_revenue: number;
  vendor_payout: number;

  delivery_otp: string | null;
}


export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  discount_price?: number;
  total_price: number;
  commission_rate?: number;
  commission_amount?: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  price: number;
}
