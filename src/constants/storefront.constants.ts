/**
 * The one country the storefront delivers to. The API takes the code (and also
 * the name, which it folds to the code); the shopper sees the name.
 */
export const DELIVERY_COUNTRY_CODE = "PK"
export const DELIVERY_COUNTRY_NAME = "Pakistan"

/**
 * The limits of the order's fields, the API's own: whatever a form accepts can
 * be recorded on the order (city, region and country are 100 there, not the 120
 * of a name).
 */
export const CHECKOUT_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  addressLine: 200,
  city: 100,
  region: 100,
} as const

/** How long an order request may take before its outcome is treated as unknown. */
export const PLACE_ORDER_TIMEOUT_MS = 30_000
