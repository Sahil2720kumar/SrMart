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

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

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
  customer_id: string; // references customers.user_id
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_group_id?: string;
  customer_id?: string; // references customers.user_id
  vendor_id?: string; // references vendors.user_id
  delivery_boy_id?: string; // references delivery_boys.user_id
  delivery_address_id?: string;
  coupon_id?: string;
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
  payment_id?: string;
  special_instructions?: string;
  cancellation_reason?: string;
  cancelled_by?: CancelledBy;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  vendors:Vendor
  order_items:OrderItem[]
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
