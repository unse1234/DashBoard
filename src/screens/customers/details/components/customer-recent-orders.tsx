import { TableScrollRegion } from "@/components/shared/table-scroll-region"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CustomerOrderSummary } from "@/lib/customers/customer.types"
import { formatDate } from "@/lib/format-date"
import { formatCurrency, formatInteger } from "@/lib/format-number"
import { CustomerOrderStatusBadge } from "@/screens/customers/details/components/customer-order-status-badge"

// On a narrow card the date moves under the order ID instead of taking a column
// of its own, so Status isn't pushed out of view.
const DATE_COLUMN_CLASS = "hidden @md:table-cell"

type CustomerRecentOrdersProps = {
  /** The customer's latest orders, newest first. */
  orders: CustomerOrderSummary[]
  /** Every order the customer has placed, which can be more than `orders`. */
  totalOrders: number
}

export function CustomerRecentOrders({
  orders,
  totalOrders,
}: CustomerRecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 id="customer-recent-orders-heading">Recent orders</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="@container flex flex-col gap-3">
        {orders.length === 0 ? (
          <p className="text-muted-foreground">
            This customer has not placed any orders yet.
          </p>
        ) : (
          <>
            <TableScrollRegion aria-labelledby="customer-recent-orders-heading">
              <Table>
                <TableCaption className="sr-only">
                  The customer&apos;s latest orders, newest first
                </TableCaption>
                <TableHeader className="bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Order ID</TableHead>
                    <TableHead className={DATE_COLUMN_CLASS}>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      {/* The ID is plain text until the Orders module has a
                          details route to link the order to. */}
                      <TableCell>
                        <span className="font-mono text-xs">{order.id}</span>
                        <time
                          dateTime={order.createdAt}
                          className="block text-muted-foreground @md:hidden"
                        >
                          {formatDate(order.createdAt)}
                        </time>
                      </TableCell>
                      <TableCell className={DATE_COLUMN_CLASS}>
                        <time dateTime={order.createdAt}>
                          {formatDate(order.createdAt)}
                        </time>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <CustomerOrderStatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollRegion>
            {totalOrders > orders.length && (
              <p className="text-muted-foreground">
                Showing the {orders.length} most recent of{" "}
                {formatInteger(totalOrders)} orders.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
