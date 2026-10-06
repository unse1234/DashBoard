import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/lib/orders/order.constants"
import type {
  Order,
  OrderSort,
  OrderSortColumn,
  OrdersQuery,
} from "@/lib/orders/order.types"
import { getOrderItemCount } from "@/lib/orders/order.utils"
import { DEFAULT_PAGE_SIZE, getTotalPages } from "@/lib/pagination"

export const defaultOrdersQuery: OrdersQuery = {
  search: "",
  status: "all",
  paymentStatus: "all",
  sort: null,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

export type OrdersQueryResult = {
  /** The rows of the current page. */
  orders: Order[]
  /** Orders matching the search and filters, across every page. */
  totalRecords: number
  /** The page these rows belong to; the last page when the query asked for one past it. */
  page: number
}

// Compares IDs by number ("ORD-31624" before "ORD-31656") and ignores case and accents.
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })

// Statuses sort by how far along they are, not alphabetically.
const comparators: Record<OrderSortColumn, (a: Order, b: Order) => number> = {
  id: (a, b) => collator.compare(a.id, b.id),
  customer: (a, b) => collator.compare(a.customer.name, b.customer.name),
  createdAt: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  itemCount: (a, b) => getOrderItemCount(a) - getOrderItemCount(b),
  total: (a, b) => a.total - b.total,
  paymentStatus: (a, b) =>
    PAYMENT_STATUSES.indexOf(a.paymentStatus) -
    PAYMENT_STATUSES.indexOf(b.paymentStatus),
  status: (a, b) =>
    ORDER_STATUSES.indexOf(a.status) - ORDER_STATUSES.indexOf(b.status),
}

function matchesSearch(order: Order, search: string) {
  const term = search.trim().toLowerCase()
  if (term === "") return true

  return [order.id, order.customer.name, order.customer.email].some((field) =>
    field.toLowerCase().includes(term)
  )
}

function sortOrders(orders: Order[], sort: OrderSort | null) {
  if (!sort) return orders

  const compare = comparators[sort.column]
  const direction = sort.direction === "asc" ? 1 : -1

  return [...orders].sort((a, b) => compare(a, b) * direction)
}

/**
 * Searches, filters, sorts and pages `orders` in memory, the way the API will
 * do it for the same `query`. Once the API exists, this call is replaced by the
 * request that returns an `OrdersQueryResult`.
 */
export function queryOrders(
  orders: readonly Order[],
  query: OrdersQuery
): OrdersQueryResult {
  const matching = orders.filter(
    (order) =>
      (query.status === "all" || order.status === query.status) &&
      (query.paymentStatus === "all" ||
        order.paymentStatus === query.paymentStatus) &&
      matchesSearch(order, query.search)
  )
  const sorted = sortOrders(matching, query.sort)

  const page = Math.min(query.page, getTotalPages(sorted.length, query.pageSize))
  const start = (page - 1) * query.pageSize

  return {
    orders: sorted.slice(start, start + query.pageSize),
    totalRecords: sorted.length,
    page,
  }
}
