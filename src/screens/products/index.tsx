import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { buttonVariants } from "@/components/ui/button"
import type { Product } from "@/lib/products/product.types"
import { routes } from "@/lib/routes"
import { ProductsList } from "@/screens/products/components/products-list"

type ProductsScreenProps = {
  products: Product[]
  totalRecords: number
}

export function ProductsScreen({ products, totalRecords }: ProductsScreenProps) {
  return (
    <>
      <DashboardHeader title="Products" />
      <PageContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Manage your products and their stock. {totalRecords} products in
            total.
          </p>
          <Link href={routes.newProduct} className={buttonVariants()}>
            <PlusIcon aria-hidden="true" />
            Add Product
          </Link>
        </div>
        <ProductsList products={products} totalRecords={totalRecords} />
      </PageContent>
    </>
  )
}
