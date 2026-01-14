import { VendorStatus } from "@/constants/vendor-status";

export interface Vendor {
  id: string;
  owner_id: string;
  store_name: string;
  status: VendorStatus;
  is_open: boolean;
  rating?: number;
  created_at: string;
}
