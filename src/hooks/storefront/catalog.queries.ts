import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import {
  getStorefrontProduct,
  listStorefrontProducts,
} from "@/services/storefront/catalog.api"
import type { StorefrontProductsQuery } from "@/types/storefront/product.types"

// Public reads: no session to wait for. Each request gets the query's abort
// signal, so a superseded search is cancelled and cannot land after a newer one.

/**
 * One page of the catalog. The previous page stays on screen while the next one
 * loads, so typing in the search box never blanks the grid.
 */
export function useStorefrontProductsQuery(query: StorefrontProductsQuery) {
  // Searches that differ only by surrounding spaces are the same request.
  const request: StorefrontProductsQuery = {
    ...query,
    search: query.search.trim(),
  }

  return useQuery({
    queryKey: catalogKeys.list(request),
    queryFn: ({ signal }) => listStorefrontProducts(request, signal),
    placeholderData: keepPreviousData,
  })
}

export function useStorefrontProductQuery(productId: string) {
  return useQuery({
    queryKey: catalogKeys.detail(productId),
    queryFn: ({ signal }) => getStorefrontProduct(productId, signal),
  })
}
