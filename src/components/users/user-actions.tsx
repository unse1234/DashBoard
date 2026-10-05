import Link from "next/link"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUserRoute } from "@/lib/routes"
import type { User } from "@/lib/users/user.types"

type UserActionsProps = {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const isActive = user.status === "active"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${user.name}`}
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem render={<Link href={getUserRoute(user.uid)} />}>
          <EyeIcon />
          View
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Not connected until the enable/disable API exists. */}
        <DropdownMenuItem>
          {isActive ? <UserRoundXIcon /> : <UserRoundCheckIcon />}
          {isActive ? "Disable" : "Enable"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
