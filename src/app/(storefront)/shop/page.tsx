import type { Metadata } from "next"

import { CatalogScreen } from "@/screens/storefront/catalog"

export const metadata: Metadata = {
  title: "Shop",
}

export default function ShopPage() {
  return <CatalogScreen />
}
