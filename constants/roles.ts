export const ROLES = {
  CUSTOMER: "customer",
  VENDOR: "vendor",
  DELIVERY: "delivery_boy",
  ADMIN: "admin",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
