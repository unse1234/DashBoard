import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  LoaderIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { IMPORT_STATUS_LABELS } from "@/constants/import.constants"
import type { ImportStatus } from "@/types/import.types"

type ImportStatusBadgeProps = {
  status: ImportStatus
}

export function ImportStatusBadge({ status }: ImportStatusBadgeProps) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      <StatusIcon status={status} />
      {IMPORT_STATUS_LABELS[status]}
    </Badge>
  )
}

function StatusIcon({ status }: ImportStatusBadgeProps) {
  switch (status) {
    case "ready":
      return <CircleCheckIcon />
    case "validation-failed":
      return <CircleAlertIcon className="fill-amber-500 dark:fill-amber-400" />
    case "processing":
      return <LoaderIcon />
    case "completed":
      return <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
    case "failed":
      return <CircleXIcon className="fill-red-500 dark:fill-red-400" />
    case "expired":
      return <ClockIcon />
  }
}
