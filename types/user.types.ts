import { Address } from "@/types/address.types";

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  addresses?: Address[];
  created_at: string;
}
