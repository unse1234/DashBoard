import type { Metadata } from "next"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { OrdersList } from "@/components/orders/orders-list"
import { mockOrders, mockTotalOrders } from "@/lib/orders/order.mock-data"

export const metadata: Metadata = {
  title: "Orders",
}

export default function OrdersPage() {
  return (
    <>
      <DashboardHeader title="Orders" />
      <PageContent>
        <p className="text-sm text-muted-foreground">
          Review and track what your customers have ordered. {mockTotalOrders}{" "}
          orders in total.
        </p>
        <OrdersList orders={mockOrders} totalRecords={mockTotalOrders} />
      </PageContent>
    </>
  )
}
