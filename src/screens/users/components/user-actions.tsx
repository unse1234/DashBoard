"use client"

import { useState } from "react"
import Link from "next/link"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { describeApiError } from "@/lib/api/api-error"
import { getUserRoute } from "@/lib/routes"
import { updateUser } from "@/lib/users/user.api"
import type { EditUserValues } from "@/lib/users/user.schemas"
import type { User } from "@/lib/users/user.types"
import { EditUserDialog } from "@/screens/users/components/edit-user-dialog"

type UserActionsProps = {
  user: User
  /** Called after the user has been changed, so the list can reload. */
  onChanged: () => void
}

export function UserActions({ user, onChanged }: UserActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const { user: currentUser } = useAuth()
  const isActive = user.status === "active"
  // The API refuses changes to your own role or status.
  const isCurrentUser = currentUser?.id === user.uid

  async function handleToggleStatus() {
    try {
      await updateUser(user.uid, { isActive: !isActive })
      toast.success(`${user.name} was ${isActive ? "disabled" : "enabled"}.`)
      onChanged()
    } catch (error) {
      toast.error(describeApiError(error))
    }
  }

  async function handleEdit(values: EditUserValues) {
    await updateUser(user.uid, values)
    toast.success(`Changes to ${values.name} were saved.`)
    onChanged()
  }

  return (
    <>
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
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isCurrentUser}
            onClick={handleToggleStatus}
          >
            {isActive ? <UserRoundXIcon /> : <UserRoundCheckIcon />}
            {isActive ? "Disable" : "Enable"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Outside the menu so it stays mounted after the menu closes. */}
      <EditUserDialog
        user={user}
        isCurrentUser={isCurrentUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
      />
    </>
  )
}
