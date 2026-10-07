import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { BackLink } from "@/components/shared/back-link"
import type { Order } from "@/lib/orders/order.types"
import { routes } from "@/lib/routes"
import { OrderAddresses } from "@/screens/orders/details/components/order-addresses"
import { OrderCustomerInformation } from "@/screens/orders/details/components/order-customer-information"
import { OrderDetailsHeader } from "@/screens/orders/details/components/order-details-header"
import { OrderItemsTable } from "@/screens/orders/details/components/order-items-table"
import { OrderPriceBreakdown } from "@/screens/orders/details/components/order-price-breakdown"

type OrderDetailsScreenProps = {
  order: Order
}

export function OrderDetailsScreen({ order }: OrderDetailsScreenProps) {
  return (
    <>
      <DashboardHeader title="Order details" />
      <PageContent>
        <BackLink href={routes.orders}>Back to Orders</BackLink>
        <div className="@container flex w-full max-w-6xl flex-col gap-4 md:gap-6">
          <OrderDetailsHeader order={order} />
          <div className="grid items-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_20rem]">
            <OrderItemsTable items={order.items} />
            <div className="flex min-w-0 flex-col gap-4">
              <OrderPriceBreakdown order={order} />
              <OrderCustomerInformation customer={order.customer} />
              <OrderAddresses order={order} />
            </div>
          </div>
        </div>
      </PageContent>
    </>
  )
}
