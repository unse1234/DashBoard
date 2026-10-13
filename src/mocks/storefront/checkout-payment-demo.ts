import type { MockPaymentMethodSummary } from "@/types/storefront/checkout-draft.types"

export const demoCheckoutCardholderName = "Jordan Maker"

/** Fictional summaries only: no full card numbers or security codes. */
export const demoCheckoutPaymentMethods: readonly MockPaymentMethodSummary[] = [
  {
    id: "demo-saved-mastercard",
    brand: "MasterCard",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2032,
    isDefault: true,
    isDemo: true,
  },
  {
    id: "demo-saved-visa",
    brand: "VISA",
    last4: "2894",
    expiryMonth: 6,
    expiryYear: 2033,
    isDefault: false,
    isDemo: true,
  },
]
