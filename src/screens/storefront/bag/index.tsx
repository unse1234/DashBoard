import { StorefrontShell } from "@/components/storefront/layout/storefront-shell"
import { BagItems } from "@/screens/storefront/bag/components/bag-items"

export function BagScreen() {
  return (
    <StorefrontShell bagPreviewAction="checkout">
      <BagItems />
    </StorefrontShell>
  )
}
