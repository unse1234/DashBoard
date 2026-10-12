import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PageContent } from "@/components/dashboard/page-content"
import { OrdersList } from "@/screens/orders/components/orders-list"
import { OrdersTotal } from "@/screens/orders/components/orders-total"

export function OrdersScreen() {
  return (
    <>
      <DashboardHeader title="Orders" />
      <PageContent>
        <p className="text-sm text-muted-foreground">
          Review and track what your customers have ordered. <OrdersTotal />
        </p>
        <OrdersList />
      </PageContent>
    </>
  )
}
