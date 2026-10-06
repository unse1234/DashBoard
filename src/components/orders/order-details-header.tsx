"use client"

import { useState } from "react"
import { toast } from "sonner"

import { OrderStatusControl } from "@/components/orders/order-status-control"
import { OrderSummary } from "@/components/orders/order-summary"
import type { Order, OrderStatus } from "@/lib/orders/order.types"
import { getStatusChangeMessage } from "@/lib/orders/order.utils"

type OrderDetailsHeaderProps = {
  order: Order
}

/**
 * Updating the status only changes this header's own copy until the API
 * exists; with it, the page gets the new status back from the server.
 */
export function OrderDetailsHeader({ order }: OrderDetailsHeaderProps) {
  const [status, setStatus] = useState(order.status)

  function changeStatus(nextStatus: OrderStatus) {
    setStatus(nextStatus)
    toast.success(getStatusChangeMessage(order.id, nextStatus))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="min-w-0 text-xl font-medium wrap-anywhere">
          Order {order.id}
        </h2>
        <OrderStatusControl status={status} onStatusChange={changeStatus} />
      </div>
      <OrderSummary order={order} status={status} />
    </div>
  )
}
