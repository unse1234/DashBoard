import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge"
import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format-date"
import { formatCurrency } from "@/lib/format-number"
import type { Order, OrderStatus } from "@/lib/orders/order.types"

type OrderSummaryProps = {
  order: Pick<Order, "paymentStatus" | "total" | "createdAt">
  /** Passed on its own because the page lets the admin change it. */
  status: OrderStatus
}

// The order ID is not repeated here: it is the page's heading.
export function OrderSummary({ order, status }: OrderSummaryProps) {
  return (
    <Card>
      <CardContent className="@container">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 @2xl:grid-cols-4">
          <DetailItem label="Order Status">
            <OrderStatusBadge status={status} />
          </DetailItem>
          <DetailItem label="Payment Status">
            <PaymentStatusBadge status={order.paymentStatus} />
          </DetailItem>
          <DetailItem label="Created At">
            <time dateTime={order.createdAt}>
              {formatDateTime(order.createdAt)}
            </time>
          </DetailItem>
          <DetailItem label="Total">
            <span className="tabular-nums">{formatCurrency(order.total)}</span>
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
