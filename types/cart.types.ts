import { Product } from "./product.types";

export interface CartItem extends Product {
  quantity: number;
}

export interface Cart {
  id: string;
  customer_id: string;
  items: CartItem[];
  total_amount: number;
  created_at: string;
}
