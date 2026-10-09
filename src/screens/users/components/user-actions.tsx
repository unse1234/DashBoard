"use client"

import { useState } from "react"
import Link from "next/link"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
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
import {
  useDeleteUserMutation,
  useSetUserActiveMutation,
  useUpdateUserMutation,
} from "@/lib/users/user.mutations"
import type { EditUserValues } from "@/lib/users/user.schemas"
import type { User } from "@/lib/users/user.types"
import { getChangedFields } from "@/lib/users/user.utils"
import { EditUserDialog } from "@/screens/users/components/edit-user-dialog"

type UserActionsProps = {
  user: User
}

type Confirmation = "disable" | "delete"

export function UserActions({ user }: UserActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const { user: currentUser } = useAuth()
  const { mutateAsync: updateUser } = useUpdateUserMutation()
  const { mutateAsync: setActive, isPending: isTogglingStatus } =
    useSetUserActiveMutation()
  const { mutateAsync: deleteUser } = useDeleteUserMutation()
  const isActive = user.status === "active"
  // The API refuses changes to your own role or status, and deleting yourself.
  const isCurrentUser = currentUser?.id === user.uid

  async function handleEnable() {
    try {
      await setActive({ uid: user.uid, isActive: true })
      toast.success(`${user.name} was enabled.`)
    } catch (error) {
      toast.error(describeApiError(error))
    }
  }

  // The confirmation dialogs below report a failure themselves, so these let it through.
  async function handleDisable() {
    await setActive({ uid: user.uid, isActive: false })
    toast.success(`${user.name} was disabled.`)
  }

  async function handleDelete() {
    await deleteUser(user.uid)
    toast.success(`${user.name} was deleted.`)
  }

  async function handleEdit(values: EditUserValues) {
    const changes = getChangedFields(user, values)
    if (Object.keys(changes).length === 0) return

    await updateUser({ uid: user.uid, changes })
    toast.success(`Changes to ${values.name} were saved.`)
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
            disabled={isCurrentUser || isTogglingStatus}
            onClick={isActive ? () => setConfirmation("disable") : handleEnable}
          >
            {isActive ? <UserRoundXIcon /> : <UserRoundCheckIcon />}
            {isActive ? "Disable" : "Enable"}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isCurrentUser}
            onClick={() => setConfirmation("delete")}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Outside the menu so they stay mounted after the menu closes. */}
      <EditUserDialog
        user={user}
        isCurrentUser={isCurrentUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEdit}
      />
      <ConfirmDialog
        open={confirmation === "disable"}
        onOpenChange={(open) => !open && setConfirmation(null)}
        title={`Disable ${user.name}?`}
        description="They will be signed out everywhere and won't be able to log in until you enable the account again."
        confirmLabel="Disable"
        pendingLabel="Disabling…"
        destructive
        onConfirm={handleDisable}
      />
      <ConfirmDialog
        open={confirmation === "delete"}
        onOpenChange={(open) => !open && setConfirmation(null)}
        title={`Delete ${user.name}?`}
        description="They will be signed out and removed from this list. This can't be undone from the dashboard, and their email address can't be invited again."
        confirmLabel="Delete user"
        pendingLabel="Deleting…"
        destructive
        onConfirm={handleDelete}
      />
    </>
  )
}
