import type { CustomersQuery } from "@/types/customer.types"

/**
 * Every customers cache entry lives under `["customers"]`, from the broadest
 * key to the most specific: `lists()` for every page of every search,
 * `detail(customerId)` for one customer's details page.
 */
export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (query: CustomersQuery) => [...customerKeys.lists(), query] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (customerId: string) =>
    [...customerKeys.details(), customerId] as const,
}
