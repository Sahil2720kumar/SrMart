export const PAYMENT_METHOD = {
  COD: "cod",
  UPI: "upi",
  CARD: "card",
  WALLET: "wallet",
} as const;

export type PaymentMethod =
  typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];
