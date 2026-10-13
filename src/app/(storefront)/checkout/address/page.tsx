import type { Metadata } from "next"

import { ShippingAddressScreen } from "@/screens/storefront/shipping-address"

export const metadata: Metadata = {
  title: "Shipping address",
}

export default function CheckoutAddressPage() {
  return <ShippingAddressScreen />
}
