import Link from "next/link"

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
import { formatCurrency, formatInteger } from "@/utils/format-number"
import type { Currency } from "@/types/currency.types"
import type { OrderItem } from "@/types/order.types"
import { getProductRoute } from "@/config/routes"

type OrderItemsTableProps = {
  items: OrderItem[]
  /** What the line amounts are denominated in: the order's currency. */
  currency: Currency
}

export function OrderItemsTable({ items, currency }: OrderItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 id="order-items-heading">Order items</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TableScrollRegion aria-labelledby="order-items-heading">
          <Table>
            <TableCaption className="sr-only">
              The products in this order and what they cost
            </TableCaption>
            <TableHeader className="bg-muted">
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {/* Product names are long, so they wrap instead of
                      stretching the table. */}
                  <TableCell className="min-w-56 font-medium whitespace-normal">
                    <Link
                      href={getProductRoute(item.productId)}
                      className="underline-offset-4 hover:underline"
                    >
                      {item.productName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.sku}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatInteger(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(item.unitPrice, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(item.total, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollRegion>
      </CardContent>
    </Card>
  )
}
