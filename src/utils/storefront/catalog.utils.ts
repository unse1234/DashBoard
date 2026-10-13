import type { StorefrontProduct } from "@/types/storefront/product.types"

/** Matches the query against the name and the subtitle, ignoring case and surrounding spaces. */
export function filterProductsByQuery(
  products: StorefrontProduct[],
  query: string
) {
  const needle = query.trim().toLowerCase()
  if (!needle) return products

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(needle) ||
      product.subtitle.toLowerCase().includes(needle)
  )
}
