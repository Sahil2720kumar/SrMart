import { DeliveryBoyStatus } from "@/constants/delivery-boy-status";

export interface DeliveryBoy {
  id: string;
  user_id: string;
  status: DeliveryBoyStatus;
  is_verified: boolean;
}
