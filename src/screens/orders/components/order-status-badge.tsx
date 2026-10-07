import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  LoaderIcon,
  TruckIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_LABELS } from "@/lib/orders/order.constants"
import type { OrderStatus } from "@/lib/orders/order.types"

type OrderStatusBadgeProps = {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      <StatusIcon status={status} />
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}

function StatusIcon({ status }: OrderStatusBadgeProps) {
  switch (status) {
    case "pending":
      return <ClockIcon aria-hidden="true" />
    case "processing":
      return <LoaderIcon aria-hidden="true" />
    case "shipped":
      return <TruckIcon aria-hidden="true" />
    case "delivered":
      return (
        <CircleCheckIcon
          aria-hidden="true"
          className="fill-green-500 dark:fill-green-400"
        />
      )
    case "cancelled":
      return (
        <CircleXIcon
          aria-hidden="true"
          className="fill-red-500 dark:fill-red-400"
        />
      )
  }
}
