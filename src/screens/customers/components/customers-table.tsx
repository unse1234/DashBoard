import Link from "next/link"

import { SortableTableHead } from "@/components/shared/sortable-table-head"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  Customer,
  CustomerSort,
  CustomerSortColumn,
} from "@/lib/customers/customer.types"
import { formatDate } from "@/lib/format-date"
import { formatCurrency, formatInteger } from "@/lib/format-number"
import { getCustomerRoute } from "@/lib/routes"
import { CustomerActions } from "@/screens/customers/components/customer-actions"

const COLUMN_COUNT = 8

// Phone is the widest column and the one scanned least, so it only appears once
// the table has room for it; otherwise it would push Joined under the pinned
// Actions column. The number is still on the details page and still searchable.
const PHONE_COLUMN_CLASS = "hidden @6xl:table-cell"

type CustomersTableProps = {
  customers: Customer[]
  sort: CustomerSort | null
  onSortChange: (column: CustomerSortColumn) => void
}

export function CustomersTable({
  customers,
  sort,
  onSortChange,
}: CustomersTableProps) {
  function getSortProps(column: CustomerSortColumn) {
    return {
      direction: sort?.column === column ? sort.direction : null,
      onSort: () => onSortChange(column),
    }
  }

  return (
    <div className="@container overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <SortableTableHead label="Customer ID" {...getSortProps("id")} />
            <SortableTableHead label="Name" {...getSortProps("name")} />
            <SortableTableHead label="Email" {...getSortProps("email")} />
            <TableHead className={PHONE_COLUMN_CLASS}>Phone</TableHead>
            <SortableTableHead
              label="Orders"
              align="end"
              {...getSortProps("totalOrders")}
            />
            <SortableTableHead
              label="Total Spent"
              align="end"
              {...getSortProps("totalSpent")}
            />
            <SortableTableHead label="Joined" {...getSortProps("joinedAt")} />
            <TableHead className="sticky right-0 bg-muted text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                <p className="font-medium">No customers found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <CustomerRow key={customer.id} customer={customer} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <TableRow className="group/row [--row-tint:color-mix(in_oklab,var(--muted)_50%,var(--background))] hover:bg-(--row-tint) has-aria-expanded:bg-(--row-tint)">
      <TableCell className="font-mono text-xs text-muted-foreground">
        {customer.id}
      </TableCell>
      <TableCell className="font-medium">
        <Link
          href={getCustomerRoute(customer.id)}
          title={customer.name}
          className="block max-w-44 truncate underline-offset-4 hover:underline"
        >
          {customer.name}
        </Link>
      </TableCell>
      <TableCell>
        <span className="block max-w-56 truncate" title={customer.email}>
          {customer.email}
        </span>
      </TableCell>
      <TableCell className={PHONE_COLUMN_CLASS}>
        {customer.phone ?? (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatInteger(customer.totalOrders)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(customer.totalSpent)}
      </TableCell>
      <TableCell>
        <time dateTime={customer.joinedAt}>{formatDate(customer.joinedAt)}</time>
      </TableCell>
      {/* Pinned so the menu stays reachable when the table scrolls sideways. It
          repeats the row's hover and menu-open tint, which is opaque so the
          cell hides what scrolls under it. */}
      <TableCell className="sticky right-0 bg-background text-right group-hover/row:bg-(--row-tint) group-has-aria-expanded/row:bg-(--row-tint)">
        <CustomerActions customer={customer} />
      </TableCell>
    </TableRow>
  )
}
