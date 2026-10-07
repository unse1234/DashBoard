import type { Metadata } from "next"

import {
  mockProducts,
  mockTotalProducts,
} from "@/lib/products/product.mock-data"
import { ProductsScreen } from "@/screens/products"

export const metadata: Metadata = {
  title: "Products",
}

export default function ProductsPage() {
  return (
    <ProductsScreen products={mockProducts} totalRecords={mockTotalProducts} />
  )
}
