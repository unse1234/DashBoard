import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent } from "@/components/ui/card"
import {
  NO_PAYMENT_METHOD_LABEL,
  PAYMENT_METHOD_LABELS,
} from "@/constants/order.constants"
import { formatDateTime } from "@/utils/format-date"
import { formatCurrency } from "@/utils/format-number"
import type { Order, OrderStatus } from "@/types/order.types"
import { OrderStatusBadge } from "@/screens/orders/components/order-status-badge"
import { PaymentStatusBadge } from "@/screens/orders/components/payment-status-badge"

type OrderSummaryProps = {
  order: Pick<
    Order,
    "paymentStatus" | "paymentMethod" | "currency" | "total" | "createdAt"
  >
  /** Passed on its own because the page lets the admin change it. */
  status: OrderStatus
}

// The order ID is not repeated here: it is the page's heading.
export function OrderSummary({ order, status }: OrderSummaryProps) {
  return (
    <Card>
      <CardContent className="@container">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 @2xl:grid-cols-5">
          <DetailItem label="Order Status">
            <OrderStatusBadge status={status} />
          </DetailItem>
          <DetailItem label="Payment Status">
            <PaymentStatusBadge status={order.paymentStatus} />
          </DetailItem>
          <DetailItem label="Payment Method">
            {order.paymentMethod === null ? (
              <span className="text-muted-foreground">
                {NO_PAYMENT_METHOD_LABEL}
              </span>
            ) : (
              PAYMENT_METHOD_LABELS[order.paymentMethod]
            )}
          </DetailItem>
          <DetailItem label="Created At">
            <time dateTime={order.createdAt}>
              {formatDateTime(order.createdAt)}
            </time>
          </DetailItem>
          <DetailItem label="Total">
            <span className="tabular-nums">
              {formatCurrency(order.total, order.currency)}
            </span>
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
