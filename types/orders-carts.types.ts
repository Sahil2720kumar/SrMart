export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';


  export type PaymentMethod =
  | 'cod'
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'wallet';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  vendor_id: string;
  delivery_boy_id?: string;
  delivery_address_id: string;
  coupon_id?: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount: number;
  coupon_discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
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
  price:number;
} 
