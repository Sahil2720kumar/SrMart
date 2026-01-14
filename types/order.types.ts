import { OrderStatus } from "@/constants/order-status";
import { PaymentStatus } from "@/constants/payment-status";
import { Address } from "./address.types";
import { OrderItem } from "./order-item.types";

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  delivery_address: Address;
  order_items: OrderItem[];
  payment_id: string;
  delivery_assignment_id: string;
}
