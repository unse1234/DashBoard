"use client"

import { useCustomersQuery } from "@/hooks/customers/customer.queries"
import { defaultCustomersQuery } from "@/screens/customers/customer.filters"

/**
 * How many customers there are in all, whatever the list is searching for.
 * It asks for the list's opening page, so on arrival it shares that request
 * and its cache entry instead of making one of its own. Nothing is shown until
 * the count is known.
 */
export function CustomersTotal() {
  const { data } = useCustomersQuery(defaultCustomersQuery)

  if (!data) return null

  return <>{data.totalRecords} customers in total.</>
}
