export const VENDOR_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  SUSPENDED: "suspended",
} as const;

export type VendorStatus =
  typeof VENDOR_STATUS[keyof typeof VENDOR_STATUS];
