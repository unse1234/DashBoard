import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"
import { ProductsList } from "@/screens/products/components/products-list"
import { ProductsTotal } from "@/screens/products/components/products-total"

export function ProductsScreen() {
  return (
    <>
      <DashboardHeader title="Products" />
      <PageContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Manage your products and their stock. <ProductsTotal />
          </p>
          <Link href={routes.newProduct} className={buttonVariants()}>
            <PlusIcon aria-hidden="true" />
            Add Product
          </Link>
        </div>
        <ProductsList />
      </PageContent>
    </>
  )
}
