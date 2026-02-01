import { KycDocumentStatus } from "./documents-kyc.types";
import { Gender, UserRole, VehicleType } from "./enums.types";

export interface User {
  id?: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  auth_id?:string
}
  
export interface Customer {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  date_of_birth?: string;
  gender?: Gender;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id?: string;
  user_id: string;
  store_name: string;
  store_description?: string;
  store_image?: string;
  store_banner?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  is_verified: boolean;
  is_open: boolean;
  rating: number;
  review_count: number;
  total_orders: number;
  kyc_status: KycDocumentStatus;
  kyc_verified_at?: string;
  kyc_rejected_reason?: string;
  business_hours: Record<string, { open: string; close: string }>;
  admin_notes?: string;
  suspended_until?: string;
  suspension_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryBoy {
  id? : string;
  user_id: string;
  first_name: string;
  last_name: string;
  profile_photo?: string;
  vehicle_type?: VehicleType;
  vehicle_number?: string;
  license_number?: string;
  is_available: boolean;
  is_online: boolean;
  current_latitude?: number;
  current_longitude?: number;
  rating: number;
  review_count: number;
  total_deliveries: number;
  kyc_status: KycDocumentStatus;
  created_at: string;
  updated_at: string;
}


export interface CustomerAddress {
  id: string;                 // uuid
  customer_id: string;        // uuid (FK → customers.user_id)

  label: string | null;

  address_line1: string;
  address_line2: string | null;

  city: string;
  state: string;
  pincode: string;

  latitude: number | null;    // numeric(10,8)
  longitude: number | null;   // numeric(11,8)

  is_default: boolean | null;

  created_at: string;         // timestamptz (ISO string)
  updated_at: string;         // timestamptz (ISO string)
}


export interface CustomerAddressInsert {
  id?: string;

  customer_id?: string;

  label?: string | null;

  address_line1: string;
  address_line2?: string | null;

  city: string;
  state: string;
  pincode: string;

  latitude?: number | null;
  longitude?: number | null;

  is_default?: boolean | null;

  created_at?: string;
  updated_at?: string;
}

export interface CustomerAddressUpdate {
  label?: string | null;

  address_line1?: string;
  address_line2?: string | null;

  city?: string;
  state?: string;
  pincode?: string;

  latitude?: number | null;
  longitude?: number | null;

  is_default?: boolean | null;

  updated_at?: string;
}

export interface CustomerAddressWithCustomer extends CustomerAddress {
  customer?: {
    user_id: string;
    name?: string;
    phone?: string;
    email?: string;
  } | null;
}

