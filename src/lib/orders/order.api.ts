import type { OrderPage } from "@/types/order.types"
import { apiClient } from "@/lib/api/axios"
import type {
  Order,
  OrderListItem,
  OrderStatus,
  OrdersQuery,
  PaymentStatus,
} from "@/types/order.types"

// The API sends enums as stored, in upper case; the UI uses lower case.
type ApiOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
type ApiPaymentStatus = "PENDING" | "PAID" | "REFUNDED"

type ApiOrderListItem = Omit<OrderListItem, "status" | "paymentStatus"> & {
  status: ApiOrderStatus
  paymentStatus: ApiPaymentStatus
}

type ApiOrder = Omit<Order, "status" | "paymentStatus"> & {
  status: ApiOrderStatus
  paymentStatus: ApiPaymentStatus
}

type OrderPageResponse = {
  data: ApiOrderListItem[]
  meta: { total: number }
}

const ORDER_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const satisfies Record<ApiOrderStatus, OrderStatus>

const API_ORDER_STATUSES = {
  pending: "PENDING",
  processing: "PROCESSING",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
} as const satisfies Record<OrderStatus, ApiOrderStatus>

const PAYMENT_STATUSES = {
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
} as const satisfies Record<ApiPaymentStatus, PaymentStatus>

const API_PAYMENT_STATUSES = {
  pending: "PENDING",
  paid: "PAID",
  refunded: "REFUNDED",
} as const satisfies Record<PaymentStatus, ApiPaymentStatus>

export function toOrderListItem(order: ApiOrderListItem): OrderListItem {
  return {
    id: order.id,
    customer: order.customer,
    status: ORDER_STATUSES[order.status],
    paymentStatus: PAYMENT_STATUSES[order.paymentStatus],
    itemCount: order.itemCount,
    total: order.total,
    createdAt: order.createdAt,
  }
}

export function toOrder(order: ApiOrder): Order {
  return {
    ...toOrderListItem(order),
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    tax: order.tax,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
  }
}

export function buildOrdersSearchParams({
  search,
  status,
  paymentStatus,
  sort,
  page,
  pageSize,
}: OrdersQuery) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (search.trim()) params.set("search", search.trim())
  if (status !== "all") params.set("status", API_ORDER_STATUSES[status])
  if (paymentStatus !== "all") {
    params.set("paymentStatus", API_PAYMENT_STATUSES[paymentStatus])
  }
  if (sort) {
    params.set("sortBy", sort.column)
    params.set("sortOrder", sort.direction)
  }
  return params
}

function orderPath(orderId: string) {
  return `/orders/${encodeURIComponent(orderId)}`
}

// All of these need a signed-in user; the API client attaches the token.

export async function listOrders(
  query: OrdersQuery,
  signal?: AbortSignal
): Promise<OrderPage> {
  const { data } = await apiClient.get<OrderPageResponse>("/orders", {
    params: buildOrdersSearchParams(query),
    signal,
  })
  return {
    orders: data.data.map(toOrderListItem),
    totalRecords: data.meta.total,
  }
}

export async function getOrder(orderId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<ApiOrder>(orderPath(orderId), { signal })
  return toOrder(data)
}

/**
 * Moves the order to `status`. The API decides whether that is allowed and
 * answers 409 with the reason if it is not. Cancelling puts the order's items
 * back into stock, and records a paid order's payment as refunded.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data } = await apiClient.patch<ApiOrder>(
    `${orderPath(orderId)}/status`,
    { status: API_ORDER_STATUSES[status] }
  )
  return toOrder(data)
}

/** Records that the order's payment arrived. */
export async function markOrderPaid(orderId: string) {
  const { data } = await apiClient.patch<ApiOrder>(
    `${orderPath(orderId)}/payment-status`,
    { paymentStatus: "PAID" }
  )
  return toOrder(data)
}
