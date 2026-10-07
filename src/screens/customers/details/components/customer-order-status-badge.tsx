import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  LoaderIcon,
  TruckIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CUSTOMER_ORDER_STATUS_LABELS } from "@/lib/customers/customer.constants"
import type { CustomerOrderStatus } from "@/lib/customers/customer.types"

type CustomerOrderStatusBadgeProps = {
  status: CustomerOrderStatus
}

export function CustomerOrderStatusBadge({
  status,
}: CustomerOrderStatusBadgeProps) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      <StatusIcon status={status} />
      {CUSTOMER_ORDER_STATUS_LABELS[status]}
    </Badge>
  )
}

function StatusIcon({ status }: CustomerOrderStatusBadgeProps) {
  switch (status) {
    case "pending":
      return <ClockIcon />
    case "processing":
      return <LoaderIcon />
    case "shipped":
      return <TruckIcon />
    case "delivered":
      return <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
    case "cancelled":
      return <CircleXIcon className="fill-red-500 dark:fill-red-400" />
  }
}
