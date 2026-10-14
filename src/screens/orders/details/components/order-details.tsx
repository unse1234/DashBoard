"use client"

import { LoadError } from "@/components/shared/load-error"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api/api-error"
import { useOrderQuery } from "@/hooks/orders/order.queries"
import { OrderAddresses } from "@/screens/orders/details/components/order-addresses"
import { OrderCustomerInformation } from "@/screens/orders/details/components/order-customer-information"
import { OrderDetailsHeader } from "@/screens/orders/details/components/order-details-header"
import { OrderItemsTable } from "@/screens/orders/details/components/order-items-table"
import { OrderNotFound } from "@/screens/orders/details/components/order-not-found"
import { OrderPriceBreakdown } from "@/screens/orders/details/components/order-price-breakdown"

const SUMMARY_STAT_COUNT = 4

type OrderDetailsProps = {
  orderId: string
}

/** Loads one order and renders the matching state: loading, missing, failed or ready. */
export function OrderDetails({ orderId }: OrderDetailsProps) {
  const { data: order, error, refetch } = useOrderQuery(orderId)

  if (error) {
    // The API answers 404 for unknown ids and 400 for ids not shaped like "ORD-10001".
    if (isApiError(error) && (error.status === 404 || error.status === 400)) {
      return <OrderNotFound />
    }
    return (
      <LoadError
        resourceName="this order"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!order) return <OrderDetailsSkeleton />

  return (
    <>
      <OrderDetailsHeader order={order} />
      <div className="grid items-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_20rem]">
        <OrderItemsTable items={order.items} currency={order.currency} />
        <div className="flex min-w-0 flex-col gap-4">
          <OrderPriceBreakdown order={order} />
          <OrderCustomerInformation customer={order.customer} />
          <OrderAddresses order={order} />
        </div>
      </div>
    </>
  )
}

/** The page's outline (header, summary, items and side cards) while it loads. */
function OrderDetailsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-72" />
      </div>
      <Card className="grid grid-cols-2 gap-4 px-(--card-spacing) @2xl:grid-cols-4">
        {Array.from({ length: SUMMARY_STAT_COUNT }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </Card>
      <div className="grid items-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-64 rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
