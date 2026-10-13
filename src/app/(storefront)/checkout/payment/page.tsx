import type { Metadata } from "next"

import { PaymentMethodScreen } from "@/screens/storefront/payment-method"

export const metadata: Metadata = {
  title: "Payment method",
}

export default function CheckoutPaymentPage() {
  return <PaymentMethodScreen />
}
