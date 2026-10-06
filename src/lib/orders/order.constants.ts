import type {
  OrderStatus,
  OrderStatusFilter,
  PaymentStatus,
  PaymentStatusFilter,
} from "@/lib/orders/order.types"

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const satisfies Record<OrderStatus, string>

/**
 * In the order an order moves through them. Cancelled comes last because it can
 * end an order from any stage before it is delivered.
 */
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const satisfies readonly OrderStatus[]

export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: ORDER_STATUS_LABELS.pending },
  { value: "processing", label: ORDER_STATUS_LABELS.processing },
  { value: "shipped", label: ORDER_STATUS_LABELS.shipped },
  { value: "delivered", label: ORDER_STATUS_LABELS.delivered },
  { value: "cancelled", label: ORDER_STATUS_LABELS.cancelled },
] as const satisfies readonly { value: OrderStatus; label: string }[]

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...ORDER_STATUS_OPTIONS,
] as const satisfies readonly { value: OrderStatusFilter; label: string }[]

export const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
} as const satisfies Record<PaymentStatus, string>

/** In the order a payment normally moves through them. */
export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "refunded",
] as const satisfies readonly PaymentStatus[]

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: PAYMENT_STATUS_LABELS.pending },
  { value: "paid", label: PAYMENT_STATUS_LABELS.paid },
  { value: "refunded", label: PAYMENT_STATUS_LABELS.refunded },
] as const satisfies readonly { value: PaymentStatusFilter; label: string }[]
