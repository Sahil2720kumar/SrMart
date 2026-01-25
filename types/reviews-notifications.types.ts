export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  vendor_id?: string;
  delivery_boy_id?: string;
  product_id?: string;
  rating: number;
  comment?: string;
  review_type: 'vendor' | 'delivery' | 'product';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'delivery' | 'promotion' | 'system' | 'review';
  is_read: boolean;
  created_at: string;
}
