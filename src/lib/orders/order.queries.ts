import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import { getOrder, listOrders } from "@/lib/orders/order.api"
import { orderKeys } from "@/lib/orders/order.keys"
import type { OrdersQuery } from "@/lib/orders/order.types"

// `enabled` keeps these from firing while the session is still being restored,
// or from retrying into a 401 after it has ended. Changing an order replaces its
// cache entry (see order.mutations.ts); everything else refreshes once stale,
// on window focus, and when the account changes.

/**
 * One page of orders. The previous page stays on screen while the next one
 * loads, so paging, sorting, searching and filtering never blank the table.
 */
export function useOrdersQuery(query: OrdersQuery) {
  const { status } = useAuth()
  // Searches that differ only by surrounding spaces are the same request.
  const request: OrdersQuery = { ...query, search: query.search.trim() }

  return useQuery({
    queryKey: orderKeys.list(request),
    queryFn: ({ signal }) => listOrders(request, signal),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  })
}

export function useOrderQuery(orderId: string) {
  const { status } = useAuth()

  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    enabled: status === "authenticated",
  })
}
