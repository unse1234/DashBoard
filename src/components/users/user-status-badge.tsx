import { CircleCheckIcon, CircleXIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { USER_STATUS_LABELS } from "@/lib/users/user.constants"
import type { UserStatus } from "@/lib/users/user.types"

type UserStatusBadgeProps = {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {status === "active" ? (
        <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
      ) : (
        <CircleXIcon />
      )}
      {USER_STATUS_LABELS[status]}
    </Badge>
  )
}
