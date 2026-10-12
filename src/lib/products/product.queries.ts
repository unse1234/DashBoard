import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/hooks/use-auth"
import {
  getProduct,
  getProductHistory,
  listCategories,
  listProducts,
} from "@/lib/products/product.api"
import { categoryKeys, productKeys } from "@/lib/products/product.keys"
import type { ProductsQuery } from "@/types/product.types"

// `enabled` keeps these from firing while the session is still being restored,
// or from retrying into a 401 after it has ended. Saving a product replaces its
// cache entries (see product.mutations.ts); everything else refreshes once
// stale, on window focus, and when the account changes.

const CATEGORIES_STALE_TIME_MS = 5 * 60 * 1000

/**
 * One page of products. The previous page stays on screen while the next one
 * loads, so paging, searching and filtering never blank the table.
 */
export function useProductsQuery(query: ProductsQuery) {
  const { status } = useAuth()
  // Searches that differ only by surrounding spaces are the same request.
  const request: ProductsQuery = { ...query, search: query.search.trim() }

  return useQuery({
    queryKey: productKeys.list(request),
    queryFn: ({ signal }) => listProducts(request, signal),
    enabled: status === "authenticated",
    placeholderData: keepPreviousData,
  })
}

export function useProductQuery(productId: string) {
  const { status } = useAuth()

  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: ({ signal }) => getProduct(productId, signal),
    enabled: status === "authenticated",
  })
}

export function useProductHistoryQuery(productId: string) {
  const { status } = useAuth()

  return useQuery({
    queryKey: productKeys.history(productId),
    queryFn: ({ signal }) => getProductHistory(productId, signal),
    enabled: status === "authenticated",
  })
}

/** The options of the category filter and the product form. */
export function useCategoriesQuery() {
  const { status } = useAuth()

  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => listCategories(signal),
    enabled: status === "authenticated",
    // Categories have no editor yet, so they rarely change.
    staleTime: CATEGORIES_STALE_TIME_MS,
  })
}
