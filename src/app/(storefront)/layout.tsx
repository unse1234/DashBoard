import type { Metadata } from "next"
import type { ReactNode } from "react"

import { storefrontFont } from "@/components/storefront/layout/storefront-font"
import { BagProvider } from "@/providers/bag-provider"
import { cn } from "@/utils/cn"

// Public routes: no RequireAuth and no dashboard shell. Replaces the root
// layout's dashboard description for every storefront page.
export const metadata: Metadata = {
  description: "Browse the catalog and place an order.",
}

type StorefrontLayoutProps = {
  children: ReactNode
}

// The layout stays mounted while shoppers move between storefront routes, so
// the bag held by the provider survives that navigation. It picks up the bag the
// last visit left (see BagProvider), priced by the server again.
export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div
      className={cn(
        storefrontFont.variable,
        "flex flex-1 flex-col bg-store-canvas font-storefront text-store-ink"
      )}
    >
      <BagProvider>{children}</BagProvider>
    </div>
  )
}
