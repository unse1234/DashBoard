import type { Metadata } from "next"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { ProductsList } from "@/components/products/products-list"
import {
  mockProducts,
  mockTotalProducts,
} from "@/lib/products/product.mock-data"

export const metadata: Metadata = {
  title: "Products",
}

export default function ProductsPage() {
  return (
    <>
      <DashboardHeader title="Products" />
      <PageContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Manage your products and their stock. {mockTotalProducts} products
            in total.
          </p>
        </div>
        <ProductsList products={mockProducts} totalRecords={mockTotalProducts} />
      </PageContent>
    </>
  )
}
