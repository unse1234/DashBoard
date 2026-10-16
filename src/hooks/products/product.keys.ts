import type { ProductsQuery } from "@/types/product.types"

/**
 * Every products cache entry lives under `["products"]`, from the broadest key
 * to the most specific: `lists()` for every page of every search, `detail(id)`
 * for one product's details and edit page, `history(id)` for its History tab.
 * Orders move stock, so they invalidate `all`.
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (query: ProductsQuery) => [...productKeys.lists(), query] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (productId: string) => [...productKeys.details(), productId] as const,
  history: (productId: string) =>
    [...productKeys.all, "history", productId] as const,
  images: (productId: string) => [...productKeys.all, "images", productId] as const,
}

export const categoryKeys = {
  all: ["categories"] as const,
}
