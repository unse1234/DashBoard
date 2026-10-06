import type { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-number"
import type { Order } from "@/lib/orders/order.types"

type OrderPriceBreakdownProps = {
  order: Pick<Order, "subtotal" | "shipping" | "discount" | "tax" | "total">
}

export function OrderPriceBreakdown({ order }: OrderPriceBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>Price breakdown</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-2">
          <PriceRow label="Subtotal">{formatCurrency(order.subtotal)}</PriceRow>
          <PriceRow label="Shipping">{formatCurrency(order.shipping)}</PriceRow>
          <PriceRow label="Discount">
            {/* A real minus sign, which screen readers announce as "minus". */}
            {order.discount > 0
              ? `−${formatCurrency(order.discount)}`
              : formatCurrency(order.discount)}
          </PriceRow>
          <PriceRow label="Tax">{formatCurrency(order.tax)}</PriceRow>
          <PriceRow label="Total" emphasized>
            {formatCurrency(order.total)}
          </PriceRow>
        </dl>
      </CardContent>
    </Card>
  )
}

type PriceRowProps = {
  label: string
  /** Sets the row apart as the sum of those above it. */
  emphasized?: boolean
  children: ReactNode
}

function PriceRow({ label, emphasized = false, children }: PriceRowProps) {
  return (
    <div
      className={
        emphasized
          ? "mt-1 flex items-baseline justify-between gap-4 border-t pt-3 font-semibold"
          : "flex items-baseline justify-between gap-4"
      }
    >
      <dt className={emphasized ? undefined : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}
