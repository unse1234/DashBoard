import Link from "next/link"

import { OrderActions } from "@/components/orders/order-actions"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge"
import { SortableTableHead } from "@/components/shared/sortable-table-head"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format-date"
import { formatCurrency, formatInteger } from "@/lib/format-number"
import type {
  Order,
  OrderSort,
  OrderSortColumn,
} from "@/lib/orders/order.types"
import { getOrderItemCount } from "@/lib/orders/order.utils"
import { getOrderRoute } from "@/lib/routes"

const COLUMN_COUNT = 8

type OrdersTableProps = {
  orders: Order[]
  sort: OrderSort | null
  onSortChange: (column: OrderSortColumn) => void
}

export function OrdersTable({ orders, sort, onSortChange }: OrdersTableProps) {
  function getSortProps(column: OrderSortColumn) {
    return {
      direction: sort?.column === column ? sort.direction : null,
      onSort: () => onSortChange(column),
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-transparent">
            <SortableTableHead label="Order ID" {...getSortProps("id")} />
            <SortableTableHead label="Customer" {...getSortProps("customer")} />
            <SortableTableHead label="Date" {...getSortProps("createdAt")} />
            <SortableTableHead
              label="Items"
              align="end"
              {...getSortProps("itemCount")}
            />
            <SortableTableHead
              label="Total"
              align="end"
              {...getSortProps("total")}
            />
            <SortableTableHead
              label="Payment"
              {...getSortProps("paymentStatus")}
            />
            <SortableTableHead label="Status" {...getSortProps("status")} />
            <TableHead className="sticky right-0 bg-muted text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMN_COUNT} className="h-40 text-center">
                <p className="font-medium">No orders found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => <OrderRow key={order.id} order={order} />)
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function OrderRow({ order }: { order: Order }) {
  return (
    <TableRow className="group/row [--row-tint:color-mix(in_oklab,var(--muted)_50%,var(--background))] hover:bg-(--row-tint) has-aria-expanded:bg-(--row-tint)">
      <TableCell>
        <Link
          href={getOrderRoute(order.id)}
          className="font-mono text-xs font-medium underline-offset-4 hover:underline"
        >
          {order.id}
        </Link>
      </TableCell>
      <TableCell>
        <span
          className="block max-w-44 truncate font-medium"
          title={order.customer.name}
        >
          {order.customer.name}
        </span>
        <span
          className="block max-w-56 truncate text-xs text-muted-foreground"
          title={order.customer.email}
        >
          {order.customer.email}
        </span>
      </TableCell>
      <TableCell>
        <time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatInteger(getOrderItemCount(order))}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(order.total)}
      </TableCell>
      <TableCell>
        <PaymentStatusBadge status={order.paymentStatus} />
      </TableCell>
      <TableCell>
        <OrderStatusBadge status={order.status} />
      </TableCell>
      {/* Pinned so the menu stays reachable when the table scrolls sideways. It
          repeats the row's hover and menu-open tint, which is opaque so the
          cell hides what scrolls under it. */}
      <TableCell className="sticky right-0 bg-background text-right group-hover/row:bg-(--row-tint) group-has-aria-expanded/row:bg-(--row-tint)">
        <OrderActions order={order} />
      </TableCell>
    </TableRow>
  )
}
