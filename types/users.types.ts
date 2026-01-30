import { Gender, KycStatus, UserRole, VehicleType } from "./enums.types";

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
  kyc_status: KycStatus;
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
  kyc_status: KycStatus;
  created_at: string;
  updated_at: string;
}
