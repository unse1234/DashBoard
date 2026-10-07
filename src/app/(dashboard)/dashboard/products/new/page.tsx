import type { Metadata } from "next"

import { NewProductScreen } from "@/screens/products/new"

export const metadata: Metadata = {
  title: "Add product",
}

export default function NewProductPage() {
  return <NewProductScreen />
}
