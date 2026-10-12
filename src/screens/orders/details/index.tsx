import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/lib/routes"
import { OrderDetails } from "@/screens/orders/details/components/order-details"

type OrderDetailsScreenProps = {
  orderId: string
}

export function OrderDetailsScreen({ orderId }: OrderDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="Order details" />
      <PageContent>
        <BackLink href={routes.orders}>Back to Orders</BackLink>
        <div className="@container flex w-full max-w-6xl flex-col gap-4 md:gap-6">
          <OrderDetails orderId={orderId} />
        </div>
      </PageContent>
    </>
  )
}
