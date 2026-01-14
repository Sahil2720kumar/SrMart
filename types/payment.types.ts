import { PaymentMethod } from "@/constants/payment-method";
import { PaymentStatus } from "@/constants/payment-status";

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transaction_id?: string;
}
