import type { Metadata } from "next"

import { BagScreen } from "@/screens/storefront/bag"

export const metadata: Metadata = {
  title: "Bag",
}

export default function BagPage() {
  return <BagScreen />
}
