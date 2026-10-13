import type { ReactNode } from "react"

import { CheckoutDraftProvider } from "@/providers/checkout-draft-provider"

type CheckoutLayoutProps = {
  children: ReactNode
}

// Shared by the checkout, address and payment steps. It deliberately has no
// navigation rail or bag preview: those belong to the catalog screen.
export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <CheckoutDraftProvider>
      <main className="flex flex-1 flex-col">{children}</main>
    </CheckoutDraftProvider>
  )
}
