import { CircleAlertIcon, CircleCheckIcon, CircleXIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { PRODUCT_STATUS_LABELS } from "@/lib/products/product.constants"
import type { ProductDisplayStatus } from "@/lib/products/product.types"

type ProductStatusBadgeProps = {
  status: ProductDisplayStatus
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      <StatusIcon status={status} />
      {PRODUCT_STATUS_LABELS[status]}
    </Badge>
  )
}

function StatusIcon({ status }: ProductStatusBadgeProps) {
  switch (status) {
    case "active":
      return <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
    case "out-of-stock":
      return <CircleAlertIcon className="fill-amber-500 dark:fill-amber-400" />
    case "inactive":
      return <CircleXIcon />
  }
}
