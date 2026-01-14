import { Role } from "@/constants/roles";

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  role: Role;
  created_at: string;
}
