import type { Metadata } from "next"

import { ConfirmationScreen } from "@/screens/storefront/confirmation"

export const metadata: Metadata = {
  title: "Order placed",
}

export default function CheckoutConfirmationPage() {
  return <ConfirmationScreen />
}
