import type { Order } from "@/lib/orders/order.types"
import { OrderStatusControl } from "@/screens/orders/details/components/order-status-control"
import { OrderSummary } from "@/screens/orders/details/components/order-summary"

type OrderDetailsHeaderProps = {
  order: Order
}

export function OrderDetailsHeader({ order }: OrderDetailsHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="min-w-0 text-xl font-medium wrap-anywhere">
          Order {order.id}
        </h2>
        <OrderStatusControl key={order.id} status={order.status} />
      </div>
      <OrderSummary order={order} status={order.status} />
    </div>
  )
}
