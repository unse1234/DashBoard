import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/lib/routes"

export default function ProductNotFound() {
  return (
    <>
      <DashboardHeader title="Product details" />
      <PageContent narrow>
        <BackLink href={routes.products}>Back to Products</BackLink>
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Product not found</h2>
          <p className="text-sm text-muted-foreground">
            There is no product with this ID. It may have been removed, or the
            link may be incorrect.
          </p>
        </div>
      </PageContent>
    </>
  )
}
