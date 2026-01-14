export const DELIVERY_BOY_STATUS = {
  AVAILABLE: "available",
  BUSY: "busy",
  OFFLINE: "offline",
} as const;

export type DeliveryBoyStatus =
  typeof DELIVERY_BOY_STATUS[keyof typeof DELIVERY_BOY_STATUS];
