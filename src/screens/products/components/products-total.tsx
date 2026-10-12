"use client"

import { useProductsQuery } from "@/hooks/products/product.queries"
import { defaultProductsQuery } from "@/lib/products/product.query"

/**
 * How many products there are in all, whatever the list is searching for. It
 * asks for the list's opening page, so on arrival it shares that request and
 * its cache entry instead of making one of its own. Nothing is shown until the
 * count is known.
 */
export function ProductsTotal() {
  const { data } = useProductsQuery(defaultProductsQuery)

  if (!data) return null

  return <>{data.totalRecords} products in total.</>
}
