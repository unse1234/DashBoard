import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/lib/routes"

export default function OrderNotFound() {
  return (
    <>
      <DashboardHeader title="Order details" />
      <PageContent narrow>
        <BackLink href={routes.orders}>Back to Orders</BackLink>
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">Order not found</h2>
          <p className="text-sm text-muted-foreground">
            There is no order with this ID. It may have been removed, or the
            link may be incorrect.
          </p>
        </div>
      </PageContent>
    </>
  )
}
