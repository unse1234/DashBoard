"use client"

import { useOrdersQuery } from "@/lib/orders/order.queries"
import { defaultOrdersQuery } from "@/lib/orders/order.query"

/**
 * How many orders there are in all, whatever the list is searching for. It asks
 * for the list's opening page, so on arrival it shares that request and its
 * cache entry instead of making one of its own. Nothing is shown until the
 * count is known.
 */
export function OrdersTotal() {
  const { data } = useOrdersQuery(defaultOrdersQuery)

  if (!data) return null

  return <>{data.totalRecords} orders in total.</>
}
