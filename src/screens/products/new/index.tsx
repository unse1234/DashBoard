import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/lib/routes"
import { NewProduct } from "@/screens/products/new/components/new-product"

export function NewProductScreen() {
  return (
    <>
      <DashboardHeader title="Add product" />
      <PageContent narrow>
        <BackLink href={routes.products}>Back to Products</BackLink>
        <NewProduct />
      </PageContent>
    </>
  )
}
