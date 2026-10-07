import type { Metadata } from "next"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/lib/routes"
import { ProductForm } from "@/screens/products/components/product-form"

export const metadata: Metadata = {
  title: "Add product",
}

export default function NewProductPage() {
  return (
    <>
      <DashboardHeader title="Add product" />
      <PageContent narrow>
        <BackLink href={routes.products}>Back to Products</BackLink>
        <ProductForm />
      </PageContent>
    </>
  )
}
