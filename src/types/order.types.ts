import type { Currency } from "@/types/currency.types"
import type { PageSize } from "@/types/pagination.types";
import type { Sort } from "@/types/sort.types";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

/** Informational only: the dashboard does not take, capture or refund payments. */
export type PaymentStatus = "pending" | "paid" | "refunded"

/**
 * How an order is paid for. Cash on delivery is collected when the parcel
 * arrives, so such an order may ship before it is paid (see `paymentStatus`).
 */
export type PaymentMethod = "cod"

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
  /** In the order's `currency`. */
  unitPrice: number
  /** `quantity` × `unitPrice`, in the order's `currency`. */
  total: number
}

/** What the list shows of an order. */
export type OrderListItem = {
  /** Public identifier and order number, also used in the details route. */
  id: string
  customer: OrderCustomer
  status: OrderStatus
  paymentStatus: PaymentStatus
  /** How it is paid for; null on orders that predate payment methods. */
  paymentMethod: PaymentMethod | null
  /** What every amount of the order is denominated in, fixed when it was placed. */
  currency: Currency
  /** Units across all lines, so two bottles and a notebook count as three. */
  itemCount: number
  /** `subtotal` + `shipping` - `discount` + `tax`, in `currency`. */
  total: number
  /** ISO 8601 timestamp. */
  createdAt: string
}

export type Order = OrderListItem & {
  items: OrderItem[]
  /** All amounts are in `currency`. */
  subtotal: number
  shipping: number
  /** The amount taken off, as a positive number. */
  discount: number
  tax: number
  shippingAddress: OrderAddress
  billingAddress: OrderAddress
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

/** Everything that decides which orders are listed; maps 1:1 to the API's query parameters. */
export type OrdersQuery = {
  search: string
  status: OrderStatusFilter
  paymentStatus: PaymentStatusFilter
  sort: OrderSort | null
  page: number
  pageSize: PageSize
}

export type OrderPage = {
  orders: OrderListItem[]
  totalRecords: number
}
