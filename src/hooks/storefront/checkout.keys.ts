import type { CheckoutQuoteRequest } from "@/types/storefront/checkout.types"

/**
 * The checkout quote's key holds everything the answer depends on (the lines
 * and the address), so a change to either is a different query: the old quote
 * is never taken for the new bag.
 */
export const checkoutKeys = {
  all: ["storefront", "checkout"] as const,
  quote: (request: CheckoutQuoteRequest | null) =>
    [...checkoutKeys.all, "quote", request] as const,
}
