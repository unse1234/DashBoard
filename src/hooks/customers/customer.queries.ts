import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/auth/use-auth"
import { getCustomerDetails, listCustomers } from "@/services/customers/customer.api"
import { customerKeys } from "@/hooks/customers/customer.keys"
import type { CustomersQuery } from "@/types/customer.types"

// Customers are read-only here, so nothing invalidates these: they refresh
// once stale, on window focus, and the cache is cleared when the account
// changes. `enabled` keeps them from firing while the session is still being
// restored, or from retrying into a 401 after it has ended.

/**
 * One page of customers. The previous page stays on screen while the next one
 * loads, so paging, sorting and searching never blank the table.
 */
export function useCustomersQuery(query: CustomersQuery) {
  const { status } = useAuth()
  // Searches that differ only by surrounding spaces are the same request.
  const request: CustomersQuery = { ...query, search: query.search.trim() }

  return useQuery({
    queryKey: customerKeys.list(request),
    queryFn: ({ signal }) => listCustomers(request, signal),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  })
}

export function useCustomerDetailsQuery(customerId: string) {
  const { status } = useAuth()

  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: ({ signal }) => getCustomerDetails(customerId, signal),
    enabled: status === "authenticated",
  })
}
