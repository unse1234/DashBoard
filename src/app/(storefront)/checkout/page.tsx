import type { Metadata } from "next"

import { CheckoutScreen } from "@/screens/storefront/checkout"

export const metadata: Metadata = {
  title: "Checkout",
}

export default function CheckoutPage() {
  return <CheckoutScreen />
}
