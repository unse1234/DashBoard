import { CircleCheckIcon, ClockIcon, Undo2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { PAYMENT_STATUS_LABELS } from "@/lib/orders/order.constants"
import type { PaymentStatus } from "@/lib/orders/order.types"

type PaymentStatusBadgeProps = {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      <StatusIcon status={status} />
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

function StatusIcon({ status }: PaymentStatusBadgeProps) {
  switch (status) {
    case "pending":
      return <ClockIcon aria-hidden="true" />
    case "paid":
      return (
        <CircleCheckIcon
          aria-hidden="true"
          className="fill-green-500 dark:fill-green-400"
        />
      )
    case "refunded":
      return <Undo2Icon aria-hidden="true" />
  }
}
