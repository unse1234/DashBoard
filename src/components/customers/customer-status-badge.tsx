import { CircleCheckIcon, CircleXIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CUSTOMER_STATUS_LABELS } from "@/lib/customers/customer.constants"
import type { CustomerStatus } from "@/lib/customers/customer.types"

type CustomerStatusBadgeProps = {
  status: CustomerStatus
}

export function CustomerStatusBadge({ status }: CustomerStatusBadgeProps) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {status === "active" ? (
        <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
      ) : (
        <CircleXIcon />
      )}
      {CUSTOMER_STATUS_LABELS[status]}
    </Badge>
  )
}
