import type { CheckoutShippingAddress } from "@/types/storefront/checkout-draft.types"

/** Fictional address for the reference's prefilled form. */
export const demoCheckoutAddress: CheckoutShippingAddress = {
  shippingName: "Jordan Maker",
  streetName: "123 Demo Grove Street",
  city: "Sampleton",
  stateProvince: "California",
  country: "United States of America",
  isDefault: true,
}
