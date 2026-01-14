import { AddressType } from "@/constants/address-type";

export interface Address {
  id: string;
  user_id: string;
  type: AddressType;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
}
