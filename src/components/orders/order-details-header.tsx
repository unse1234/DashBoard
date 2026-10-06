import { OrderSummary } from "@/components/orders/order-summary"
import type { Order } from "@/lib/orders/order.types"

type OrderDetailsHeaderProps = {
  order: Order
}

export function OrderDetailsHeader({ order }: OrderDetailsHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="min-w-0 text-xl font-medium wrap-anywhere">
        Order {order.id}
      </h2>
      <OrderSummary order={order} status={order.status} />
    </div>
  )
}
