import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { ProductsList } from "@/components/products/products-list"
import { buttonVariants } from "@/components/ui/button"
import {
  mockProducts,
  mockTotalProducts,
} from "@/lib/products/product.mock-data"
import { routes } from "@/lib/routes"

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
          <Link href={routes.newProduct} className={buttonVariants()}>
            <PlusIcon aria-hidden="true" />
            Add Product
          </Link>
        </div>
        <ProductsList products={mockProducts} totalRecords={mockTotalProducts} />
      </PageContent>
    </>
  )
}
