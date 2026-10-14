import type { StorefrontProductsQuery } from "@/types/storefront/product.types"

/**
 * Every public-catalog cache entry lives under `["storefront", "catalog"]`,
 * from the broadest key to the most specific. The key of a list holds every
 * input the server's answer depends on (search, sort, category, page), so two
 * different requests never share an entry.
 */
export const catalogKeys = {
  all: ["storefront", "catalog"] as const,
  lists: () => [...catalogKeys.all, "list"] as const,
  list: (query: StorefrontProductsQuery) =>
    [...catalogKeys.lists(), query] as const,
  details: () => [...catalogKeys.all, "detail"] as const,
  detail: (productId: string) => [...catalogKeys.details(), productId] as const,
}
