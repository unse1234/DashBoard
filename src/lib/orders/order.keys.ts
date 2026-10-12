import type { OrdersQuery } from "@/lib/orders/order.types"

/**
 * Every orders cache entry lives under `["orders"]`, from the broadest key to
 * the most specific: `lists()` for every page of every search and filter,
 * `detail(orderId)` for one order's details page.
 */
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (query: OrdersQuery) => [...orderKeys.lists(), query] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
}
