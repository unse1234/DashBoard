import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatDateTime } from "@/lib/format-date"
import { USER_COLUMNS, USER_ROLE_LABELS } from "@/lib/users/user.constants"
import type { User } from "@/lib/users/user.types"
import { UserActions } from "@/screens/users/components/user-actions"
import { UserStatusBadge } from "@/screens/users/components/user-status-badge"

const COLUMN_COUNT = USER_COLUMNS.length + 1
const SKELETON_ROW_COUNT = 5

type UsersTableProps = {
  users: User[]
  /** True while the first page loads or a newer page is being fetched. */
  isLoading: boolean
  /** Called after a row action (edit, enable, disable) has changed a user. */
  onUserChanged: () => void
}

export function UsersTable({
  users,
  isLoading,
  onUserChanged,
}: UsersTableProps) {
  const isFirstLoad = isLoading && users.length === 0

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table aria-busy={isLoading}>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            {USER_COLUMNS.map((column) => (
              <TableHead key={column.id}>{column.label}</TableHead>
            ))}
            <TableHead className="sticky right-0 bg-muted text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isLoading && !isFirstLoad ? "opacity-60" : ""}>
          {isFirstLoad ? (
            <SkeletonRows />
          ) : users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <UserRow
                key={user.uid}
                user={user}
                onUserChanged={onUserChanged}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function SkeletonRows() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
    <TableRow key={row} className="hover:bg-transparent">
      {Array.from({ length: COLUMN_COUNT }, (_, cell) => (
        <TableCell key={cell}>
          <Skeleton className="h-4 w-full max-w-32" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

type UserRowProps = {
  user: User
  onUserChanged: () => void
}

function UserRow({ user, onUserChanged }: UserRowProps) {
  return (
    <TableRow className="group/row [--row-tint:color-mix(in_oklab,var(--muted)_50%,var(--background))] hover:bg-(--row-tint) has-aria-expanded:bg-(--row-tint)">
      <TableCell className="font-mono text-xs text-muted-foreground">
        <span className="block max-w-28 truncate" title={user.uid}>
          {user.uid}
        </span>
      </TableCell>
      <TableCell className="font-medium">
        <span className="block max-w-44 truncate" title={user.name}>
          {user.name}
        </span>
      </TableCell>
      <TableCell>
        <span className="block max-w-56 truncate" title={user.email}>
          {user.email}
        </span>
      </TableCell>
      <TableCell>{USER_ROLE_LABELS[user.role]}</TableCell>
      <TableCell>
        <UserStatusBadge status={user.status} />
      </TableCell>
      <TableCell>
        <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
      </TableCell>
      <TableCell>
        {user.lastLoginAt ? (
          <time dateTime={user.lastLoginAt}>
            {formatDateTime(user.lastLoginAt)}
          </time>
        ) : (
          <span className="text-muted-foreground">Never</span>
        )}
      </TableCell>
      {/* Pinned so the menu stays reachable when the table scrolls sideways. It
          repeats the row's hover and menu-open tint, which is opaque so the
          cell hides what scrolls under it. */}
      <TableCell className="sticky right-0 bg-background text-right group-hover/row:bg-(--row-tint) group-has-aria-expanded/row:bg-(--row-tint)">
        <UserActions user={user} onChanged={onUserChanged} />
      </TableCell>
    </TableRow>
  )
}
