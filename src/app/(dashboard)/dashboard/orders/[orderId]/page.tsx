import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { OrderAddresses } from "@/components/orders/order-addresses"
import { OrderCustomerInformation } from "@/components/orders/order-customer-information"
import { OrderDetailsHeader } from "@/components/orders/order-details-header"
import { OrderItemsTable } from "@/components/orders/order-items-table"
import { OrderPriceBreakdown } from "@/components/orders/order-price-breakdown"
import { BackLink } from "@/components/shared/back-link"
import { getMockOrderById } from "@/lib/orders/order.mock-data"
import { routes } from "@/lib/routes"

type OrderDetailsPageProps = PageProps<"/dashboard/orders/[orderId]">

export async function generateMetadata({
  params,
}: OrderDetailsPageProps): Promise<Metadata> {
  const { orderId } = await params
  const order = getMockOrderById(orderId)

  return { title: order ? `Order ${order.id}` : "Order not found" }
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { orderId } = await params
  const order = getMockOrderById(orderId)

  if (!order) notFound()

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
