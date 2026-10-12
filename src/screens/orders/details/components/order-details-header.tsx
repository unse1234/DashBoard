"use client"

import { toast } from "sonner"

import { ORDER_STATUS_LABELS } from "@/constants/order.constants"
import {
  useMarkOrderPaidMutation,
  useUpdateOrderStatusMutation,
} from "@/hooks/orders/order.mutations"
import type { Order, OrderStatus } from "@/types/order.types"
import { OrderPaymentControl } from "@/screens/orders/details/components/order-payment-control"
import { OrderStatusControl } from "@/screens/orders/details/components/order-status-control"
import { OrderSummary } from "@/screens/orders/details/components/order-summary"

type OrderDetailsHeaderProps = {
  order: Order
}

export function OrderDetailsHeader({ order }: OrderDetailsHeaderProps) {
  const { mutateAsync: updateStatus } = useUpdateOrderStatusMutation()
  const { mutateAsync: markPaid } = useMarkOrderPaidMutation()
  // An order can be paid for until it is cancelled.
  const canMarkPaid =
    order.paymentStatus === "pending" && order.status !== "cancelled"

  // The controls report a failure themselves, so these let it through.
  async function handleStatusChange(status: OrderStatus) {
    const updated = await updateStatus({ orderId: order.id, status })
    toast.success(
      `Order ${order.id} is now ${ORDER_STATUS_LABELS[updated.status].toLowerCase()}.`
    )
  }

  async function handleMarkPaid() {
    await markPaid(order.id)
    toast.success(`Order ${order.id} was marked as paid.`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="min-w-0 text-xl font-medium wrap-anywhere">
          Order {order.id}
        </h2>
        <div className="flex flex-col gap-2 sm:items-end">
          <OrderStatusControl
            key={`${order.id}:${order.status}`}
            orderId={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            onStatusChange={handleStatusChange}
          />
          {canMarkPaid && (
            <OrderPaymentControl
              orderId={order.id}
              total={order.total}
              onMarkPaid={handleMarkPaid}
            />
          )}
        </div>
      </div>
      <OrderSummary order={order} status={order.status} />
    </div>
  )
}
