import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import type { Order } from "@/lib/orders/order.types"
import { OrdersList } from "@/screens/orders/components/orders-list"

type OrdersScreenProps = {
  orders: Order[]
  totalRecords: number
}

export function OrdersScreen({ orders, totalRecords }: OrdersScreenProps) {
  return (
    <>
      <DashboardHeader title="Orders" />
      <PageContent>
        <p className="text-sm text-muted-foreground">
          Review and track what your customers have ordered. {totalRecords}{" "}
          orders in total.
        </p>
        <OrdersList orders={orders} totalRecords={totalRecords} />
      </PageContent>
    </>
  )
}
