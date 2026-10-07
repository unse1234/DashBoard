import { SortableTableHead } from "@/components/shared/sortable-table-head"
import { UserActions } from "@/components/users/user-actions"
import { UserStatusBadge } from "@/components/users/user-status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatDateTime } from "@/lib/format-date"
import { USER_COLUMNS } from "@/lib/users/user.constants"
import type {
  User,
  UserSort,
  UserSortColumn,
} from "@/lib/users/user.types"

const COLUMN_COUNT = USER_COLUMNS.length + 1

type UsersTableProps = {
  users: User[]
  sort: UserSort | null
  onSortChange: (column: UserSortColumn) => void
}

export function UsersTable({ users, sort, onSortChange }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            {USER_COLUMNS.map((column) => (
              <SortableTableHead
                key={column.id}
                label={column.label}
                direction={sort?.column === column.id ? sort.direction : null}
                onSort={() => onSortChange(column.id)}
              />
            ))}
            <TableHead className="sticky right-0 bg-muted text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                <p className="font-medium">No users found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => <UserRow key={user.uid} user={user} />)
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function UserRow({ user }: { user: User }) {
  return (
    <TableRow className="group/row [--row-tint:color-mix(in_oklab,var(--muted)_50%,var(--background))] hover:bg-(--row-tint) has-aria-expanded:bg-(--row-tint)">
      <TableCell className="font-mono text-xs text-muted-foreground">
        {user.uid}
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
        <UserActions user={user} />
      </TableCell>
    </TableRow>
  )
}
