export const ADDRESS_TYPE = {
  HOME: "home",
  WORK: "work",
  OTHER: "other",
} as const;

export type AddressType =
  typeof ADDRESS_TYPE[keyof typeof ADDRESS_TYPE];
