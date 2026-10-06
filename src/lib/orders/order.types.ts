import type { PageSize } from "@/lib/pagination"
import type { Sort } from "@/lib/sort"

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

/** Informational only: the dashboard does not take, capture or refund payments. */
export type PaymentStatus = "pending" | "paid" | "refunded"

/**
 * The customer as the order recorded them, so an order keeps reading the same
 * if the customer later changes their details. It is the Orders module's own
 * type, not the Customers module's.
 */
export type OrderCustomer = {
  /** The customer's public identifier, e.g. "CUS-1001". */
  id: string
  name: string
  email: string
  /** As the customer typed it; null when none was given. */
  phone: string | null
}

export type OrderAddress = {
  recipientName: string
  phone: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  /** State, province or prefecture, where the country has one. */
  region: string | null
  postalCode: string | null
  country: string
}

/** A line of the order, with the product's name and price as they were when it was placed. */
export type OrderItem = {
  id: string
  /** The product's public identifier, also used in its details route. */
  productId: string
  productName: string
  sku: string
  quantity: number
  /** In USD. */
  unitPrice: number
  /** `quantity` × `unitPrice`, in USD. */
  total: number
}

export type Order = {
  /** Public identifier and order number, also used in the details route. */
  id: string
  customer: OrderCustomer
  status: OrderStatus
  paymentStatus: PaymentStatus
  items: OrderItem[]
  /** All amounts are in USD. */
  subtotal: number
  shipping: number
  /** The amount taken off, as a positive number. */
  discount: number
  tax: number
  /** `subtotal` + `shipping` - `discount` + `tax`. */
  total: number
  shippingAddress: OrderAddress
  billingAddress: OrderAddress
  /** ISO 8601 timestamp. */
  createdAt: string
}

export type OrderStatusFilter = OrderStatus | "all"

export type PaymentStatusFilter = PaymentStatus | "all"

/** The columns the list can be sorted by. */
export type OrderSortColumn =
  | "id"
  | "customer"
  | "createdAt"
  | "itemCount"
  | "total"
  | "paymentStatus"
  | "status"

export type OrderSort = Sort<OrderSortColumn>

/** Everything that decides which orders are listed; maps 1:1 to future API or URL params. */
export type OrdersQuery = {
  search: string
  status: OrderStatusFilter
  paymentStatus: PaymentStatusFilter
  sort: OrderSort | null
  page: number
  pageSize: PageSize
}
